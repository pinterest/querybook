interface IPropsWithUid {
    uid: number;
    name?: string;
}
interface IPropsWithName {
    uid?: number;
    name: string;
}

export type ICommonUserLoaderProps = IPropsWithUid | IPropsWithName;
