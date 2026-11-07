# The long-lived Python behind code-views.js's runChecks: python-control's import alone costs about 4 s, so one worker
# imports the heavy modules once and then runs each snippet as if pasted alone into a fresh python: its own globals
# dict, its own captured stdout and stderr, its own working folder (a temporary copy made by the caller). Module-level
# state a snippet can leave behind (matplotlib figures, numpy print options, the working folder) is reset after each.
# Protocol, one JSON object per line: {"ready": true} on the original stdout once the imports are done; then for
# each request {"file", "cwd"} on stdin a reply {"ok", "stdout", "stderr"}. The snippet's own prints never reach the protocol stream: fd 1 is pointed at stderr.
import io, json, os, sys, traceback, contextlib

proto = os.fdopen(os.dup(1), "w", encoding="utf-8")
os.dup2(2, 1)

for name in sys.argv[1:]:
    try:
        __import__(name)
    except ImportError:
        pass  # a lab that lacks it fails in its own snippet, with Python's own message

try:
    import numpy as _np
    _print_options = _np.get_printoptions()
except ImportError:
    _np = None
home = os.getcwd()
proto.write(json.dumps({"ready": True}) + "\n")
proto.flush()


def reset():
    os.chdir(home)
    if _np is not None:
        _np.set_printoptions(**_print_options)
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is not None:
        plt.close("all")


for line in sys.stdin:
    req = json.loads(line)
    out, err, ok = io.StringIO(), io.StringIO(), True
    try:
        with open(req["file"], encoding="utf-8") as f:
            code = compile(f.read(), req["file"], "exec")
        os.chdir(req["cwd"])
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                exec(code, {"__name__": "__main__", "__file__": req["file"], "__builtins__": __builtins__})
            except SystemExit as e:
                ok = e.code in (None, 0)
            except BaseException:
                ok = False
                traceback.print_exc()
    except BaseException:
        ok = False
        err.write(traceback.format_exc())
    finally:
        reset()
    proto.write(json.dumps({"ok": ok, "stdout": out.getvalue(), "stderr": err.getvalue()}) + "\n")
    proto.flush()
