from __future__ import annotations

import sys
from dataclasses import dataclass, field
from fractions import Fraction
from os import environ

import auto_editor
from auto_editor.analyze import Levels
from auto_editor.ffwrapper import initFileInfo
from auto_editor.lang.palet import ClosingError, Lexer, Parser, env, interpret
from auto_editor.lang.stdenv import make_standard_env
from auto_editor.lib.data_structs import print_str
from auto_editor.lib.err import MyError
from auto_editor.utils.bar import initBar
from auto_editor.utils.log import Log
from auto_editor.utils.types import frame_rate
from auto_editor.vanparse import ArgumentParser

# Add history file support
import os
from pathlib import Path

# In the main function, after the readline import:
try:
    import readline
    
    # Set up history file
    history_file = os.path.join(Path.home(), '.auto_editor_history')
    try:
        readline.read_history_file(history_file)
        # Set history file size
        readline.set_history_length(1000)
    except FileNotFoundError:
        pass
        
    # Save history on exit
    import atexit
    atexit.register(readline.write_history_file, history_file)
except ImportError:
    pass


@dataclass(slots=True)
class REPL_Args:
    input: list[str] = field(default_factory=list)
    debug_parser: bool = False
    timebase: Fraction | None = None
    ffmpeg_location: str | None = None
    my_ffmpeg: bool = False
    temp_dir: str | None = None
    help: bool = False


def repl_options(parser: ArgumentParser) -> ArgumentParser:
    parser.add_required("input", nargs="*")
    parser.add_argument(
        "--debug-parser",
        flag=True,
        help="Print parser value",
    )
    parser.add_argument(
        "--timebase",
        "-tb",
        metavar="NUM",
        type=frame_rate,
        help="Set custom timebase",
    )
    parser.add_argument(
        "--temp-dir",
        metavar="PATH",
        help="Set where the temporary directory is located",
    )
    return parser


def main(sys_args: list[str] = sys.argv[1:]) -> None:
    args = repl_options(ArgumentParser(None)).parse_args(REPL_Args, sys_args)

    if args.input:
        log = Log(quiet=True, temp_dir=args.temp_dir)
        strict = len(args.input) < 2
        sources = [initFileInfo(path, log) for path in args.input]
        src = sources[0]
        tb = src.get_fps() if args.timebase is None else args.timebase
        env["timebase"] = tb
        env["@levels"] = Levels(src, tb, initBar("modern"), False, log, strict)

    env.update(make_standard_env())
    print(f"Auto-Editor {auto_editor.__version__}")
    text = None

    no_color = bool(environ.get("NO_COLOR") or environ.get("AV_LOG_FORCE_NOCOLOR"))
    if no_color:
        bold_pink = bold_red = reset = ""
    else:
        bold_pink = "\033[1;95m"
        bold_red = "\033[1;31m"
        reset = "\033[0m"

    try:
        while True:
            try:
                if text is None:
                    text = input(f"{bold_pink}>{reset} ")
                else:
                    text += "\n" + input("   ")
            except KeyboardInterrupt as e:
                if text is None:
                    raise e
                text = None
                print("")
                continue

            try:
                parser = Parser(Lexer("repl", text))
                if args.debug_parser:
                    print(f"parser: {parser}")

                for result in interpret(env, parser):
                    if result is not None:
                        sys.stdout.write(f"{print_str(result)}\n")
                        env["_"] = result

            except ClosingError:
                continue  # Allow user to continue adding text
            except MyError as e:
                print(f"{bold_red}error{reset}: {e}")

            text = None

    except (KeyboardInterrupt, EOFError):
        print("")


if __name__ == "__main__":
    main()
