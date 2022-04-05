import math

from datetime import datetime
from multiprocessing.util import Finalize


from celery import current_app
from celery import schedules
from celery.beat import ScheduleEntry, Scheduler
from celery.utils.log import get_logger
from kombu.utils.encoding import safe_str

from lib.schedule import ALL_JOBS
from models.schedule import TaskSchedule, TaskSchedules
from logic.schedule import (
    get_all_active_task_schedules,
    create_task_schedule,
    get_task_schedule_by_name,
    update_task_schedule,
)


ADD_ENTRY_ERROR = """\
Cannot add entry %r to database schedule: %r. Contents: %r
"""
# This scheduler must wake up more frequently than the
# regular of 5 minutes because it needs to take external
# changes to the schedule into account.
DEFAULT_MAX_INTERVAL = 5  # seconds

logger = get_logger(__name__)


class ModelEntry(ScheduleEntry):
    save_fields = ["last_run_at", "total_run_count", "no_changes"]
    valid_options = ["queue", "exchange", "routing_key", "expires", "priority"]

    def __init__(self, model: TaskSchedule, app=None):
        self.app = app or current_app
        self.app.now = datetime.now

        self.schedule = model.schedule
        self.name = model.name
        self.task = model.task

        try:
            self.args = model.args or []
            self.kwargs = model.kwargs or {}
            options = model.options or {}

        except ValueError as exc:
            logger.exception(
                "Removing schedule %s for argument deseralization error: %r",
                self.name,
                exc,
            )
            self._disable(model)

        self.options = {"shadow": self.name}
        for option in self.valid_options:
            if option in options:
                self.options[option] = options[option]

        self.total_run_count = model.total_run_count
        self.model = model

        if not model.last_run_at:
            model.last_run_at = self._default_now()

        self.last_run_at = model.last_run_at

    def _disable(self, model):
        update_task_schedule(model.id, enabled=False, no_changes=True)

    def is_due(self):
        if not self.model.enabled:
            return schedules.schedstate(False, 5.0)  # 5 second delay for re-enable.

        if self.model.start_time is not None:
            now = self._default_now()
            if now < self.model.start_time:
                delay = math.ceil((self.model.start_time - now).total_seconds())
                return schedules.schedstate(False, delay)

        return self.schedule.is_due(self.last_run_at)

    def _default_now(self):
        return datetime.now()

    def __next__(self):
        self.model.last_run_at = self.app.now()
        self.model.total_run_count += 1
        self.model.no_changes = True
        return self.__class__(self.model, app=self.app)

    next = __next__

    def save(self):
        update_dict = {}
        for field in self.save_fields:
            update_dict[field] = getattr(self.model, field)
        update_task_schedule(self.model.id, **update_dict)

    @classmethod
    def from_entry(cls, name, app=None, **entry):
        task_schedule = get_task_schedule_by_name(name)
        if not task_schedule:
            task_schedule = create_task_schedule(
                name=name, **cls._unpack_fields(**entry)
            )
        return cls(model=task_schedule, app=app)

    @classmethod
    def _unpack_fields(
        cls, task, schedule, args=[], kwargs={}, relative=None, options={}, **entry
    ):
        return {
            "task": task,
            "cron": schedule,
            "args": args,
            "kwargs": kwargs,
            "options": cls._filter_options(options),
        }

    @classmethod
    def _filter_options(cls, options):
        options_ret = {}
        for option in cls.valid_options:
            if option in options:
                options_ret[option] = options[option]
        return options_ret

    def __repr__(self):
        return "<ModelEntry: {0} {1}(*{2}, **{3}) {4}>".format(
            safe_str(self.name),
            self.task,
            self.args,
            self.kwargs,
            self.schedule,
        )


class DatabaseScheduler(Scheduler):
    # How often to sync the schedule (3 minutes by default).
    # Basically this will update the total_run_count and last_run_at in db
    sync_every = 2 * 60

    Entry = ModelEntry
    Model = TaskSchedule
    Changes = TaskSchedules

    _schedule = None
    _last_timestamp = None
    _initial_read = False
    _heap_invalidated = False

    def __init__(self, *args, **kwargs):
        self._dirty = set()
        self._finalize = Finalize(self, self.sync, exitpriority=5)
        super(DatabaseScheduler, self).__init__(*args, **kwargs)
        self.max_interval = (
            kwargs.get("max_interval")
            or self.app.conf.CELERYBEAT_MAX_LOOP_INTERVAL
            or DEFAULT_MAX_INTERVAL
        )

    def setup_schedule(self):
        # no need to install any default entries as its added in the table anyway
        self.install_default_entries(self.schedule)
        self.update_from_dict(self.app.conf.beat_schedule)

    def all_as_schedule(self):
        logger.debug("DatabaseScheduler: Fetching database schedule")
        s = {}
        for model in get_all_active_task_schedules():
            try:
                entry = self.Entry(model, self.app)
                s[entry.name] = entry
            except ValueError:
                pass
        return s

    def schedule_changed(self):
        last, ts = self._last_timestamp, self.Changes.last_change()
        try:
            if ts and ts > (last if last else ts):
                logger.info(
                    "DatabaseScheduler: Schedules are changed. Old: %s, New: %s",
                    last,
                    ts,
                )
                return True
        finally:
            self._last_timestamp = ts
        return False

    def reserve(self, entry):
        new_entry = Scheduler.reserve(self, entry)
        # Need to store entry by name, because the entry may change in the mean time.
        self._dirty.add(new_entry.name)
        return new_entry

    def sync(self):
        logger.info("Writing entries...")
        _tried = set()
        _failed = set()
        try:
            while self._dirty:
                try:
                    name = self._dirty.pop()
                    _tried.add(name)
                    self.schedule[name].save()
                except KeyError:
                    pass
        finally:
            # retry later, only for the failed ones
            self._dirty |= _failed

    def install_default_entries(self, data):
        # celery.backend_cleanup is the default task which celery will schedule.
        # Since that is added in db, we don't need it again
        entries = ALL_JOBS
        if self.app.conf.result_expires:
            entries.setdefault(
                "celery.backend_cleanup",
                {
                    "task": "celery.backend_cleanup",
                    "schedule": "0 3 * * *",
                },
            )
        self.update_from_dict(entries)

    def update_from_dict(self, mapping):
        s = {}
        for name, entry_fields in (mapping or {}).items():
            try:
                entry = self.Entry.from_entry(name=name, app=self.app, **entry_fields)
                if entry.model.enabled:
                    s[name] = entry

            except Exception as exc:
                logger.error(ADD_ENTRY_ERROR, name, exc, entry_fields)
        self.schedule.update(s)

    def schedules_equal(self, *args, **kwargs):
        if self._heap_invalidated:
            self._heap_invalidated = False
            return False
        return super(DatabaseScheduler, self).schedules_equal(*args, **kwargs)

    @property
    def schedule(self):
        initial = update = False
        if not self._initial_read:
            logger.debug("DatabaseScheduler: initial read")
            initial = update = True
            self._initial_read = True
        elif self.schedule_changed():
            logger.info("DatabaseScheduler: Schedules are changed.")
            update = True

        if update:
            self.sync()
            self._schedule = self.all_as_schedule()
            # the schedule changed, invalidate the heap in Scheduler.tick
            if not initial:
                self._heap = []
                self._heap_invalidated = True
            logger.debug(
                "Current schedule:\n%s",
                "\n".join(repr(entry) for entry in self._schedule.values()),
            )
        return self._schedule
