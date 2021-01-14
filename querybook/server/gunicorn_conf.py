import multiprocessing

workers = multiprocessing.cpu_count()
worker_class = "gevent"
worker_connections = 1000

timeout = 120
