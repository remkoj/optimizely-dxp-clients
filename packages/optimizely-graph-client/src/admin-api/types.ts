export type JournalResponse = {
    took: number,
    errors: boolean,
    items: null | any[],
    executedAt: string,
    source: string | null,
    id: string,
    createdAt: string
}

export type PostContentV2DataHandlerResponse = {
    journalId: string
}