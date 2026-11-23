/*
 * mini-kv 0.1.0 — a tiny in-memory key-value cache speaking RESP2.
 * Single-threaded, epoll-based, non-blocking I/O.
 *
 * Supported commands: PING, ECHO, SET (EX/PX/NX/XX/KEEPTTL), GET, DEL,
 * EXISTS, EXPIRE, TTL, PTTL, FLUSHALL, DBSIZE, INFO, COMMAND (introspection
 * stub), SELECT, AUTH, CONFIG (stub), QUIT.
 */
#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <signal.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/epoll.h>
#include <sys/socket.h>
#include <time.h>
#include <unistd.h>

#include "dict.h"

#define MINIKV_VERSION "0.1.0"
#define DEFAULT_PORT 7379
#define MAX_CLIENTS 1024
#define MAX_ARGS 1024
#define MAX_ARG_BYTES (64 * 1024 * 1024)
#define READ_CHUNK 16384

static kv_dict *g_db;
static int64_t g_start_ms;
static int64_t g_total_connections;
static int g_connected;
static volatile sig_atomic_t g_stop;

static int64_t now_ms(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (int64_t)ts.tv_sec * 1000 + ts.tv_nsec / 1000000;
}

/* ---------- client write buffer ---------- */

typedef struct client {
    int fd;
    unsigned char *rbuf;
    size_t rlen, rcap;
    unsigned char *wbuf;
    size_t wlen, wcap, woff; /* woff = start offset of pending data */
    int close_after_write;
} client;

static void wbuf_compact(client *c)
{
    if (c->woff == 0) return;
    if (c->wlen > 0) memmove(c->wbuf, c->wbuf + c->woff, c->wlen);
    c->woff = 0;
}

static int wbuf_reserve(client *c, size_t extra)
{
    wbuf_compact(c);
    if (c->wlen + extra <= c->wcap) return 0;
    size_t ncap = c->wcap ? c->wcap : 4096;
    while (ncap < c->wlen + extra) ncap *= 2;
    unsigned char *nb = realloc(c->wbuf, ncap);
    if (!nb) return -1;
    c->wbuf = nb;
    c->wcap = ncap;
    return 0;
}

static int wbuf_append(client *c, const void *data, size_t len)
{
    if (wbuf_reserve(c, len) != 0) return -1;
    memcpy(c->wbuf + c->wlen, data, len);
    c->wlen += len;
    return 0;
}

static int wbuf_printf(client *c, const char *fmt, ...)
{
    char tmp[512];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(tmp, sizeof tmp, fmt, ap);
    va_end(ap);
    return wbuf_append(c, tmp, strlen(tmp));
}

static int wbuf_simple(client *c, const char *s)
{
    return wbuf_printf(c, "+%s\r\n", s);
}

static int wbuf_error(client *c, const char *msg)
{
    return wbuf_printf(c, "-ERR %s\r\n", msg);
}

static int wbuf_int(client *c, long long n)
{
    return wbuf_printf(c, ":%lld\r\n", n);
}

static int wbuf_bulk(client *c, const char *data, size_t len)
{
    if (!data) return wbuf_append(c, "$-1\r\n", 5);
    if (wbuf_printf(c, "$%zu\r\n", len) != 0) return -1;
    if (wbuf_append(c, data, len) != 0) return -1;
    return wbuf_append(c, "\r\n", 2);
}

static int wbuf_bulk_null(client *c)
{
    return wbuf_append(c, "$-1\r\n", 5);
}

static int wbuf_raw(client *c, const char *s)
{
    return wbuf_append(c, s, strlen(s));
}

/* ---------- RESP parsing ---------- */

typedef struct command {
    int argc;
    char *argv[MAX_ARGS];
    size_t alens[MAX_ARGS];
    size_t consumed; /* total bytes of the raw command in the buffer */
} command;

static void command_free(command *cmd)
{
    for (int i = 0; i < cmd->argc; i++) free(cmd->argv[i]);
    cmd->argc = 0;
}

/* Find "\r\n" starting at offset; returns index of '\r' or -1. */
static long find_crlf(const unsigned char *buf, size_t from, size_t end)
{
    for (size_t i = from; i + 1 < end; i++) {
        if (buf[i] == '\r' && buf[i + 1] == '\n') return (long)i;
    }
    return -1;
}

/*
 * Try to parse one command from c->rbuf.
 * Returns 1 on success (command filled, bytes consumed tracked),
 *         0 if more data needed,
 *        -1 on protocol error.
 */
static int try_parse(const client *c, command *cmd)
{
    memset(cmd, 0, sizeof *cmd);
    if (c->rlen == 0) return 0;

    /* inline command (telnet-friendly): "PING\r\n" */
    if (c->rbuf[0] != '*') {
        for (size_t i = 0; i < c->rlen; i++) {
            if (c->rbuf[i] == '\n') {
                size_t end = i;
                if (end > 0 && c->rbuf[end - 1] == '\r') end--;
                if (end > READ_CHUNK * 4) return -1;
                char *line = malloc(end + 1);
                memcpy(line, c->rbuf, end);
                line[end] = '\0';
                char *save = NULL, *tok = strtok_r(line, " ", &save);
                while (tok && cmd->argc < MAX_ARGS) {
                    cmd->alens[cmd->argc] = strlen(tok);
                    cmd->argv[cmd->argc] = strdup(tok);
                    cmd->argc++;
                    tok = strtok_r(NULL, " ", &save);
                }
                free(line);
                cmd->consumed = i + 1;
                return 1;
            }
        }
        if (c->rlen > READ_CHUNK * 4) return -1;
        return 0;
    }

    /* RESP array: *<n>\r\n ... */
    long eol = find_crlf(c->rbuf, 1, c->rlen);
    if (eol < 0) return c->rlen > 128 ? -1 : 0;
    long nargs = strtol((char *)c->rbuf + 1, NULL, 10);
    if (nargs < 0 || nargs > MAX_ARGS) return -1;
    if (nargs == 0) { cmd->consumed = (size_t)eol + 2; return 1; } /* *0\r\n */

    size_t pos = (size_t)eol + 2;
    size_t total_bytes = 0;
    for (long i = 0; i < nargs; i++) {
        if (pos >= c->rlen) return 0;
        if (c->rbuf[pos] != '$') return -1;
        eol = find_crlf(c->rbuf, pos + 1, c->rlen);
        if (eol < 0) {
            return c->rlen - pos > 64 ? -1 : 0;
        }
        long blen = strtol((char *)c->rbuf + pos + 1, NULL, 10);
        if (blen < 0 || (size_t)blen > MAX_ARG_BYTES) return -1;
        size_t data_start = (size_t)eol + 2;
        size_t data_end = data_start + (size_t)blen;
        if (c->rlen < data_end + 2) return 0;
        if (c->rbuf[data_end] != '\r' || c->rbuf[data_end + 1] != '\n') return -1;
        cmd->argv[cmd->argc] = malloc((size_t)blen ? (size_t)blen : 1);
        memcpy(cmd->argv[cmd->argc], c->rbuf + data_start, (size_t)blen);
        cmd->alens[cmd->argc] = (size_t)blen;
        cmd->argc++;
        total_bytes += (size_t)blen;
        pos = data_end + 2;
    }
    cmd->consumed = pos;
    return 1;
}

/* ---------- command helpers ---------- */

static int arg_ieq(const char *arg, size_t len, const char *name)
{
    size_t nlen = strlen(name);
    if (len != nlen) return 0;
    for (size_t i = 0; i < len; i++) {
        char a = arg[i], b = name[i];
        if (a >= 'a' && a <= 'z') a -= 32;
        if (b >= 'a' && b <= 'z') b -= 32;
        if (a != b) return 0;
    }
    return 1;
}

static int arg_to_i64(const char *arg, size_t len, int64_t *out)
{
    if (len == 0 || len > 20) return -1;
    int64_t v = 0;
    int neg = 0, i = 0;
    if (arg[0] == '-') { neg = 1; i = 1; }
    if (i == (int)len) return -1;
    for (; i < (int)len; i++) {
        if (arg[i] < '0' || arg[i] > '9') return -1;
        v = v * 10 + (arg[i] - '0');
    }
    *out = neg ? -v : v;
    return 0;
}

/* ---------- command execution ---------- */

static void exec_command(client *c, const command *cmd)
{
    if (cmd->argc == 0) return; /* empty inline line: no reply */
    const char *a0 = cmd->argv[0];
    size_t l0 = cmd->alens[0];

    if (arg_ieq(a0, l0, "PING")) {
        if (cmd->argc == 1) wbuf_simple(c, "PONG");
        else wbuf_bulk(c, cmd->argv[1], cmd->alens[1]);
        return;
    }
    if (arg_ieq(a0, l0, "ECHO")) {
        if (cmd->argc != 2) { wbuf_error(c, "wrong number of arguments for 'echo'"); return; }
        wbuf_bulk(c, cmd->argv[1], cmd->alens[1]);
        return;
    }
    if (arg_ieq(a0, l0, "QUIT")) {
        wbuf_simple(c, "OK");
        c->close_after_write = 1;
        return;
    }
    if (arg_ieq(a0, l0, "SELECT")) {
        /* single logical database only */
        if (cmd->argc == 2 && arg_ieq(cmd->argv[1], cmd->alens[1], "0")) wbuf_simple(c, "OK");
        else wbuf_error(c, "only database 0 is supported");
        return;
    }
    if (arg_ieq(a0, l0, "AUTH")) {
        /* no password configured */
        wbuf_simple(c, "OK");
        return;
    }
    if (arg_ieq(a0, l0, "COMMAND")) { /* introspection stub keeps redis-cli happy */
        wbuf_raw(c, "*0\r\n");
        return;
    }
    if (arg_ieq(a0, l0, "CONFIG")) {
        wbuf_raw(c, "*0\r\n");
        return;
    }
    if (arg_ieq(a0, l0, "FLUSHALL") || arg_ieq(a0, l0, "FLUSHDB")) {
        kv_dict_flush(g_db);
        wbuf_simple(c, "OK");
        return;
    }
    if (arg_ieq(a0, l0, "DBSIZE")) {
        wbuf_int(c, (long long)kv_dict_count(g_db));
        return;
    }
    if (arg_ieq(a0, l0, "GET")) {
        if (cmd->argc != 2) { wbuf_error(c, "wrong number of arguments for 'get'"); return; }
        size_t vlen = 0;
        const char *v = kv_dict_get(g_db, cmd->argv[1], cmd->alens[1], &vlen);
        if (v) wbuf_bulk(c, v, vlen); else wbuf_bulk_null(c);
        return;
    }
    if (arg_ieq(a0, l0, "DEL")) {
        if (cmd->argc < 2) { wbuf_error(c, "wrong number of arguments for 'del'"); return; }
        long long n = 0;
        for (int i = 1; i < cmd->argc; i++)
            n += kv_dict_del(g_db, cmd->argv[i], cmd->alens[i]);
        wbuf_int(c, n);
        return;
    }
    if (arg_ieq(a0, l0, "EXISTS")) {
        if (cmd->argc < 2) { wbuf_error(c, "wrong number of arguments for 'exists'"); return; }
        long long n = 0;
        for (int i = 1; i < cmd->argc; i++)
            n += kv_dict_exists(g_db, cmd->argv[i], cmd->alens[i]) ? 1 : 0;
        wbuf_int(c, n);
        return;
    }
    if (arg_ieq(a0, l0, "SET")) {
        if (cmd->argc < 3) { wbuf_error(c, "wrong number of arguments for 'set'"); return; }
        int64_t expire_at = 0;
        int nx = 0, xx = 0, keepttl = 0;
        for (int i = 3; i < cmd->argc; i++) {
            if (arg_ieq(cmd->argv[i], cmd->alens[i], "EX") && i + 1 < cmd->argc) {
                int64_t secs;
                if (arg_to_i64(cmd->argv[i + 1], cmd->alens[i + 1], &secs) != 0 || secs <= 0) {
                    wbuf_error(c, "invalid expire time in 'set'");
                    return;
                }
                expire_at = now_ms() + secs * 1000;
                i++;
            } else if (arg_ieq(cmd->argv[i], cmd->alens[i], "PX") && i + 1 < cmd->argc) {
                int64_t ms;
                if (arg_to_i64(cmd->argv[i + 1], cmd->alens[i + 1], &ms) != 0 || ms <= 0) {
                    wbuf_error(c, "invalid expire time in 'set'");
                    return;
                }
                expire_at = now_ms() + ms;
                i++;
            } else if (arg_ieq(cmd->argv[i], cmd->alens[i], "NX")) {
                nx = 1;
            } else if (arg_ieq(cmd->argv[i], cmd->alens[i], "XX")) {
                xx = 1;
            } else if (arg_ieq(cmd->argv[i], cmd->alens[i], "KEEPTTL")) {
                keepttl = 1;
            } else {
                wbuf_error(c, "syntax error");
                return;
            }
        }
        int key_exists = kv_dict_exists(g_db, cmd->argv[1], cmd->alens[1]);
        if (nx && key_exists) { wbuf_bulk_null(c); return; }
        if (xx && !key_exists) { wbuf_bulk_null(c); return; }
        if (keepttl && expire_at == 0) {
            int64_t cur = kv_dict_ttl_ms(g_db, cmd->argv[1], cmd->alens[1]);
            if (cur > 0) expire_at = now_ms() + cur;
        }
        kv_dict_set(g_db, cmd->argv[1], cmd->alens[1], cmd->argv[2], cmd->alens[2], expire_at);
        wbuf_simple(c, "OK");
        return;
    }
    if (arg_ieq(a0, l0, "EXPIRE")) {
        if (cmd->argc != 3) { wbuf_error(c, "wrong number of arguments for 'expire'"); return; }
        int64_t secs;
        if (arg_to_i64(cmd->argv[2], cmd->alens[2], &secs) != 0) {
            wbuf_error(c, "value is not an integer or out of range");
            return;
        }
        if (secs <= 0) {
            /* delete immediately, like Redis */
            wbuf_int(c, kv_dict_del(g_db, cmd->argv[1], cmd->alens[1]) ? 1 : 0);
            return;
        }
        wbuf_int(c, kv_dict_expire(g_db, cmd->argv[1], cmd->alens[1], now_ms() + secs * 1000));
        return;
    }
    if (arg_ieq(a0, l0, "TTL") || arg_ieq(a0, l0, "PTTL")) {
        int in_ms = arg_ieq(a0, l0, "PTTL");
        if (cmd->argc != 2) { wbuf_error(c, "wrong number of arguments for 'ttl'"); return; }
        int64_t ms = kv_dict_ttl_ms(g_db, cmd->argv[1], cmd->alens[1]);
        if (ms == -2) { wbuf_int(c, -2); return; }
        if (ms == -1) { wbuf_int(c, -1); return; }
        wbuf_int(c, in_ms ? (long long)ms : (long long)((ms + 999) / 1000));
        return;
    }
    if (arg_ieq(a0, l0, "INFO")) {
        int64_t uptime_s = (now_ms() - g_start_ms) / 1000;
        char body[1024];
        snprintf(body, sizeof body,
                 "# Server\r\n"
                 "redis_version:%s\r\n"
                 "minikv_version:%s\r\n"
                 "uptime_in_seconds:%lld\r\n"
                 "process_id:%d\r\n"
                 "# Clients\r\n"
                 "connected_clients:%d\r\n"
                 "total_connections_received:%lld\r\n"
                 "# Keyspace\r\n"
                 "db0:keys=%zu,expires=0\r\n",
                 MINIKV_VERSION, MINIKV_VERSION, (long long)uptime_s, (int)getpid(),
                 g_connected, (long long)g_total_connections, kv_dict_count(g_db));
        wbuf_bulk(c, body, strlen(body));
        return;
    }

    /* RESP-style error output keeps redis-cli diagnostics readable */
    wbuf_printf(c, "-ERR unknown command '%.*s'\r\n", (int)l0, a0);
}

/* ---------- client I/O ---------- */

static client *client_new(int fd)
{
    client *c = calloc(1, sizeof *c);
    c->fd = fd;
    return c;
}

static void client_free(client *c)
{
    free(c->rbuf);
    free(c->wbuf);
    free(c);
}

static void client_consume(client *c, size_t n)
{
    if (n >= c->rlen) {
        c->rlen = 0;
    } else {
        memmove(c->rbuf, c->rbuf + n, c->rlen - n);
        c->rlen -= n;
    }
}

static void client_process(client *c)
{
    for (;;) {
        command cmd;
        int rc = try_parse(c, &cmd);
        if (rc == 0) return;          /* need more data */
        if (rc == -1) {               /* protocol error: complain & drop */
            wbuf_error(c, "Protocol error");
            c->close_after_write = 1;
            return;
        }
        client_consume(c, cmd.consumed);
        if (cmd.argc > 0) exec_command(c, &cmd);
        command_free(&cmd);
        if (c->close_after_write) return;
    }
}

static int epfd;

static void client_close(int fd, client *c)
{
    epoll_ctl(epfd, EPOLL_CTL_DEL, fd, NULL);
    close(fd);
    client_free(c);
    g_connected--;
}

static void set_events(int fd, client *c, uint32_t events)
{
    struct epoll_event ev = {0};
    ev.events = events;
    ev.data.ptr = c;
    epoll_ctl(epfd, EPOLL_CTL_MOD, fd, &ev);
}

static void handle_read(client *c)
{
    unsigned char tmp[READ_CHUNK];
    int got_eof = 0;

    for (int i = 0; i < 64; i++) { /* cap reads per wakeup */
        ssize_t n = read(c->fd, tmp, sizeof tmp);
        if (n > 0) {
            if (c->rlen + (size_t)n > MAX_ARG_BYTES) { /* abusive peer */
                wbuf_error(c, "Protocol error (request too large)");
                c->close_after_write = 1;
                break;
            }
            if (c->rlen + (size_t)n > c->rcap) {
                size_t ncap = c->rcap ? c->rcap : 8192;
                while (ncap < c->rlen + (size_t)n) ncap *= 2;
                unsigned char *nb = realloc(c->rbuf, ncap);
                if (!nb) { c->close_after_write = 1; break; }
                c->rbuf = nb;
                c->rcap = ncap;
            }
            memcpy(c->rbuf + c->rlen, tmp, (size_t)n);
            c->rlen += (size_t)n;
            continue;
        }
        if (n == 0) { got_eof = 1; }
        else if (errno == EAGAIN || errno == EWOULDBLOCK) break;
        else if (errno == EINTR) continue;
        else got_eof = 1;
        break;
    }

    if (c->rlen > 0 && !c->close_after_write)
        client_process(c);

    if (got_eof) {
        if (c->wlen == 0 && c->woff == 0) {
            /* fully drained, peer done */
            int fd = c->fd;
            client_close(fd, c);
            return;
        }
        /* half-close: flush remaining output, then close */
        c->close_after_write = 1;
    }

    if (c->wlen > c->woff) set_events(c->fd, c, EPOLLIN | EPOLLOUT | EPOLLRDHUP);
    else if (c->close_after_write) /* nothing to flush; drop now */ {
        int fd = c->fd;
        client_close(fd, c);
    }
}

static void handle_write(client *c)
{
    while (c->wlen > c->woff) {
        ssize_t n = write(c->fd, c->wbuf + c->woff, c->wlen - c->woff);
        if (n > 0) { c->woff += (size_t)n; continue; }
        if (errno == EAGAIN || errno == EWOULDBLOCK) break;
        if (errno == EINTR) continue;
        int fd = c->fd;
        client_close(fd, c);
        return;
    }
    if (c->wlen == c->woff) {
        c->woff = 0;
        c->wlen = 0;
        if (c->close_after_write) {
            int fd = c->fd;
            client_close(fd, c);
            return;
        }
        set_events(c->fd, c, EPOLLIN | EPOLLRDHUP);
    }
}

static void accept_clients(int listen_fd)
{
    for (;;) {
        struct sockaddr_in addr;
        socklen_t alen = sizeof addr;
        int fd = accept4(listen_fd, (struct sockaddr *)&addr, &alen, SOCK_NONBLOCK | SOCK_CLOEXEC);
        if (fd < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) return;
            if (errno == EINTR) continue;
            return;
        }
        if (g_connected >= MAX_CLIENTS) { close(fd); continue; }
        int one = 1;
        setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &one, sizeof one);
        client *c = client_new(fd);
        struct epoll_event ev = {0};
        ev.events = EPOLLIN | EPOLLRDHUP;
        ev.data.ptr = c;
        if (epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &ev) != 0) {
            client_free(c);
            close(fd);
            continue;
        }
        g_connected++;
        g_total_connections++;
    }
}

/* ---------- main ---------- */

static void on_signal(int sig) { (void)sig; g_stop = 1; }

static int listen_on(int port)
{
    int fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, 0);
    if (fd < 0) { perror("socket"); exit(1); }
    int one = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons((uint16_t)port);
    if (bind(fd, (struct sockaddr *)&addr, sizeof addr) != 0) {
        perror("bind");
        exit(1);
    }
    if (listen(fd, 128) != 0) { perror("listen"); exit(1); }
    return fd;
}

int main(int argc, char **argv)
{
    int port = DEFAULT_PORT;
    for (int i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "--port") && i + 1 < argc) {
            port = atoi(argv[++i]);
            if (port <= 0 || port > 65535) { fprintf(stderr, "invalid port\n"); return 1; }
        } else if (!strcmp(argv[i], "--help")) {
            printf("minikv %s — usage: minikv [--port N]  (default port %d)\n", MINIKV_VERSION, DEFAULT_PORT);
            return 0;
        } else {
            fprintf(stderr, "unknown argument: %s\n", argv[i]);
            return 1;
        }
    }

    signal(SIGINT, on_signal);
    signal(SIGTERM, on_signal);
    signal(SIGPIPE, SIG_IGN);

    g_db = kv_dict_create();
    g_start_ms = now_ms();
    int listen_fd = listen_on(port);

    epfd = epoll_create1(EPOLL_CLOEXEC);
    struct epoll_event ev = {0};
    ev.events = EPOLLIN;
    ev.data.ptr = NULL; /* listen fd sentinel */
    epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

    printf("minikv %s listening on 0.0.0.0:%d (RESP2, %d max clients)\n",
           MINIKV_VERSION, port, MAX_CLIENTS);
    fflush(stdout);

    int64_t last_sweep = 0;
    struct epoll_event events[64];

    while (!g_stop) {
        int nfds = epoll_wait(epfd, events, 64, 500);
        int64_t t = now_ms();
        if (t - last_sweep > 500) {
            kv_dict_sweep_expired(g_db, t);
            last_sweep = t;
        }
        for (int i = 0; i < nfds; i++) {
            client *c = events[i].data.ptr;
            if (c == NULL) { accept_clients(listen_fd); continue; }
            uint32_t e = events[i].events;
            if (e & (EPOLLERR | EPOLLHUP | EPOLLRDHUP)) {
                /* try a final drain of input/output before closing */
                if (e & EPOLLIN) handle_read(c);
                else if (e & EPOLLOUT) handle_write(c);
                else {
                    int fd = c->fd;
                    client_close(fd, c);
                }
                continue;
            }
            if (e & EPOLLIN) handle_read(c);
            else if (e & EPOLLOUT) handle_write(c);
        }
    }

    fprintf(stderr, "minikv shutting down\n");
    kv_dict_free(g_db);
    close(listen_fd);
    close(epfd);
    return 0;
}
