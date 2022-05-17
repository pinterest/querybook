export interface ITag {
    id: number;
    name: string;
    created_at: number;
    updated_at: number;
    meta?: {
        admin?: boolean;
        color?: string;
        icon?: string;
        tooltip?: string;
        rank?: number;
    };
}
