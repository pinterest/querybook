# From https://stackoverflow.com/questions/287871/how-to-print-colored-text-to-the-terminal?rq=1
from env import QuerybookSettings


class bcolors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    CLEAR = "\033c"


logo_text = f"""\n\n{bcolors.OKCYAN}
   ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗██████╗  ██████╗  ██████╗ ██╗  ██╗
  ██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝
  ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝ ██████╔╝██║   ██║██║   ██║█████╔╝
  ██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝  ██╔══██╗██║   ██║██║   ██║██╔═██╗
  ╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║   ██████╔╝╚██████╔╝╚██████╔╝██║  ██╗
   ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
{bcolors.ENDC}\n\n"""


def print_welcome_message():
    print(bcolors.CLEAR)
    print(logo_text)
    print(
        f"""
  - Website is served on {bcolors.BOLD}{QuerybookSettings.PUBLIC_URL}{bcolors.ENDC}
  - Run terminal inside container with {bcolors.BOLD}docker exec -it querybook_web_1 bash{bcolors.ENDC}
  - Stop the containers with {bcolors.BOLD}ctrl+c{bcolors.ENDC} or run {bcolors.BOLD}make bundled_off{bcolors.ENDC}
"""
    )
