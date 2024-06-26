export class LogsService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Get request logs
     * Get _incoming/outgoing_ request logs
     * @param page
     * @param requestId
     * @param host
     * @param path
     * @param success
     * @returns RequestLog Ok
     * @throws ApiError
     */
    getRequestLogHandler(page, requestId, host, path, success) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/logs/request',
            query: {
                'page': page,
                'requestId': requestId,
                'host': host,
                'path': path,
                'success': success,
            },
        });
    }
}
//# sourceMappingURL=LogsService.js.map