#!/usr/bin/env python3
"""Integration tests for minikv — self-contained, stdlib-only.

Usage: ./tests/test_minikv.py [port]
Starts ./minikv on the given port, exercises it over TCP with a minimal
RESP2 client, then shuts it down.
"""
import os
import signal
import socket
import subprocess
import sys
import time

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 7379
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN = os.path.join(ROOT, "minikv")

PASS, FAIL = 0, 0


def check(name, cond):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ok   {name}")
    else:
        FAIL += 1
        print(f"  FAIL {name}")


def encode(*args):
    out = [f"*{len(args)}\r\n".encode()]
    for a in args:
        if isinstance(a, str):
            a = a.encode()
        out.append(b"$" + str(len(a)).encode() + b"\r\n" + a + b"\r\n")
    return b"".join(out)


class Client:
    def __init__(self, port):
        self.sock = socket.create_connection(("127.0.0.1", port), timeout=5)
        self.buf = b""

    def _fill(self, n=1):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ConnectionError("server closed connection")
            self.buf += chunk

    def _readline(self):
        while b"\r\n" not in self.buf:
            self._fill()
        line, self.buf = self.buf.split(b"\r\n", 1)
        return line

    def _read_exact(self, n):
        while len(self.buf) < n:
            self._fill()
        out, self.buf = self.buf[:n], self.buf[n:]
        self._readline()  # trailing CRLF
        return out

    def read_reply(self):
        line = self._readline()
        kind, rest = line[:1], line[1:]
        if kind == b"+":
            return rest.decode()
        if kind == b"-":
            return RuntimeError(rest.decode())
        if kind == b":":
            return int(rest)
        if kind == b"$":
            n = int(rest)
            return None if n == -1 else self._read_exact(n)
        if kind == b"*":
            n = int(rest)
            if n == -1:
                return None
            return [self.read_reply() for _ in range(n)]
        raise ValueError(f"unsupported reply type: {line!r}")

    def cmd(self, *args):
        self.sock.sendall(encode(*args))
        return self.read_reply()

    def close(self):
        self.sock.close()


def wait_for_server(port, timeout=5.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            socket.create_connection(("127.0.0.1", port), timeout=0.25).close()
            return True
        except OSError:
            time.sleep(0.05)
    return False


def main():
    if not os.path.exists(BIN):
        print(f"minikv binary not found at {BIN} — run 'make' first.", file=sys.stderr)
        return 1

    proc = subprocess.Popen([BIN, "--port", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not wait_for_server(PORT):
            print("server did not start", file=sys.stderr)
            return 1

        c = Client(PORT)
        print(f"minikv integration tests (port {PORT}, pid {proc.pid})")

        check("PING", c.cmd("PING") == "PONG")
        check("PING with message", c.cmd("PING", "world") == b"world")
        check("SET", c.cmd("SET", "foo", "bar") == "OK")
        check("GET", c.cmd("GET", "foo") == b"bar")
        check("EXISTS", c.cmd("EXISTS", "foo") == 1)
        check("OVERWRITE", c.cmd("SET", "foo", "baz") == "OK")
        check("GET after overwrite", c.cmd("GET", "foo") == b"baz")
        check("DEL", c.cmd("DEL", "foo") == 1)
        check("GET after DEL", c.cmd("GET", "foo") is None)
        check("EXISTS after DEL", c.cmd("EXISTS", "foo") == 0)

        check("SET NX on missing key", c.cmd("SET", "nxkey", "v", "NX") == "OK")
        check("SET NX on existing key", c.cmd("SET", "nxkey", "v2", "NX") is None)
        check("SET XX on existing key", c.cmd("SET", "nxkey", "v3", "XX") == "OK")
        check("SET XX on missing key", c.cmd("SET", "xxmissing", "v", "XX") is None)
        check("GET nxkey", c.cmd("GET", "nxkey") == b"v3")
        check("DEL nxkey", c.cmd("DEL", "nxkey") == 1)

        check("SET EX", c.cmd("SET", "ttlkey", "v", "EX", "100") == "OK")
        ttl = c.cmd("TTL", "ttlkey")
        check("TTL in (0,100]", isinstance(ttl, int) and 1 <= ttl <= 100)
        pttl = c.cmd("PTTL", "ttlkey")
        check("PTTL in (0,100000] ms", isinstance(pttl, int) and 0 < pttl <= 100000)
        check("EXPIRE existing", c.cmd("EXPIRE", "ttlkey", "100") == 1)
        check("EXPIRE missing key", c.cmd("EXPIRE", "nope", "100") == 0)
        check("DEL ttlkey", c.cmd("DEL", "ttlkey") == 1)

        check("TTL on missing key", c.cmd("TTL", "nokey") == -2)
        c.cmd("SET", "notlkey", "v")
        check("TTL on key without TTL", c.cmd("TTL", "notlkey") == -1)

        c.cmd("FLUSHALL")
        check("DBSIZE after FLUSHALL", c.cmd("DBSIZE") == 0)
        check("FLUSHALL reply", c.cmd("FLUSHALL") == "OK")
        check("ECHO", c.cmd("ECHO", "hello") == b"hello")
        check("SELECT 0", c.cmd("SELECT", "0") == "OK")
        info = c.cmd("INFO")
        check("INFO contains minikv_version", info is not None and b"minikv_version" in info)

        err = c.cmd("FROBNICATE", "x")
        check("unknown command errors", isinstance(err, RuntimeError) and "unknown command" in str(err))

        # pipeline: two commands, one round trip
        c.sock.sendall(encode("SET", "pipe", "pipeval") + encode("GET", "pipe"))
        r1, r2 = c.read_reply(), c.read_reply()
        check("pipeline SET", r1 == "OK")
        check("pipeline GET", r2 == b"pipeval")

        # inline command fallback (nc/telnet style)
        c.sock.sendall(b"PING\r\n")
        check("inline PING", c.read_reply() == "PONG")

        c.close()
    finally:
        proc.send_signal(signal.SIGTERM)
        proc.wait(timeout=5)

    print(f"\npassed: {PASS}   failed: {FAIL}")
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
