# Backend contribution rules

Read ../docs/architecture.md and ../docs/testing.md. Keep host integration in app.go/cmd, HTTP transport in server, use-case orchestration in core, persistence/domain in library, process execution in downloader.

Preserve compatibility with existing vaults and Trove configuration names. Storage/schema changes require migration/recovery consideration and temporary-directory tests. Test subprocess cleanup with controlled fixtures, never the user's active downloads. Do not log credentials, cookie contents, private paths or media unnecessarily. Run gofmt on changed Go files and targeted package tests; broaden to go test ./... for shared backend changes.
