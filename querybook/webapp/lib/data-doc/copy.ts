const copyCommandPrefix = '__QUERYBOOK__DATADOC__';

interface ICopyCommand {
    cellId: number;
    cut: boolean; // if cut, then delete cell after paste
}
export function serializeCopyCommand(command: ICopyCommand) {
    return copyCommandPrefix + JSON.stringify(command);
}

export function deserializeCopyCommand(command: string): ICopyCommand {
    if (command.startsWith(copyCommandPrefix)) {
        try {
            return JSON.parse(command.slice(copyCommandPrefix.length));
        } catch (e) {
            return null;
        }
    }
    return null;
}
