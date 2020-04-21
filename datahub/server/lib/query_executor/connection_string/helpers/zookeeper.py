from typing import List

from kazoo.client import KazooClient

from app.flask_app import cache

CACHE_REFRESH_INTERVAL_SEC = 300


@cache.memoize(CACHE_REFRESH_INTERVAL_SEC)
def get_hostname_and_port_from_zk(zk_quorum: str, zk_namespace: str) -> List[str]:
    zk = None
    try:
        zk = KazooClient(hosts=zk_quorum)
        zk.start()
        if not zk.exists(zk_namespace):
            raise Exception(f"{zk_namespace} does not exist on Zookeeper ({zk_quorum})")
        return zk.get_children(zk_namespace)
    finally:
        if zk:
            zk.stop()
            zk.close()
