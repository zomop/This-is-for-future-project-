# mini-kv

A tiny in-memory key-value cache written from scratch in C11 — a RESP2-compatible
subset you can talk to with `redis-cli` (or any Redis client). Built as a systems
playground with a long-term roadmap.

## Why

- Drop-in lightweight cache for local development and tinkering
- Single-threaded, event-driven (epoll), non-blocking I/O
- Zero runtime dependencies (libc + libm only)
- Hash table with chaining, lazy + periodic TTL expiry
- Incremental RESP2 protocol parser (inline-command fallback for `nc`/telnet)

## Build

```sh
make            # produces ./minikv
```

## Run

```sh
./minikv                # listens on 0.0.0.0:7379
./minikv --port 6379    # custom port
```

Client examples:

```sh
redis-cli -p 7379 ping
redis-cli -p 7379 set greeting "hello, world" EX 60
redis-cli -p 7379 get greeting
redis-cli -p 7379 info
```

## Supported commands

| Command | Notes |
|---|---|
| `PING [msg]` | simple or bulk reply |
| `ECHO msg` | |
| `SET key val [EX s \| PX ms] [NX \| XX] [KEEPTTL]` | full option set |
| `GET key` | |
| `DEL key [key ...]` | |
| `EXISTS key [key ...]` | counts duplicates, like Redis |
| `EXPIRE key seconds` | `EXPIRE key 0` deletes, like Redis |
| `TTL key` / `PTTL key` | `-2` missing, `-1` no TTL |
| `FLUSHALL` / `FLUSHDB` | |
| `DBSIZE` | |
| `INFO` | server/clients/keyspace sections |
| `COMMAND`, `CONFIG`, `SELECT 0`, `AUTH`, `QUIT` | compatibility stubs |

## Test

```sh
make
./tests/test_minikv.py          # stdlib-only integration tests, starts a temp server
./tests/test_minikv.py 7390     # custom test port
```

## Design / layout

```
src/minikv.c   event loop, RESP2 parsing, command execution
src/dict.c     hash table keyspace with lazy + periodic TTL sweep
include/dict.h keyspace API
tests/test_minikv.py  stdlib-only RESP2 integration tests
```

Single-threaded epoll loop with non-blocking sockets; replies are buffered per
client and flushed with `EPOLLOUT` when needed. `EPOLLRDHUP` handles half-closes.

## Roadmap

- [ ] AOF (append-only file) persistence + `BGSAVE`-style snapshot
- [ ] `INCR` / `DECR` / `INCRBY` and counter semantics
- [ ] Lists (`LPUSH`/`RPOP`) and sets (`SADD`/`SMEMBERS`)
- [ ] Lazy expiry sampling tuning, `maxmemory` with LRU eviction
- [ ] `mini-benchmark` mode + perf comparison vs real Redis
- [ ] Optional TLS and AUTH password
- [ ] Pub/Sub

## Status

v0.1.0 — string commands only, single logical database, no persistence yet.
