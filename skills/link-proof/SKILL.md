---
name: link-proof
description: Fetches every link end to end before handing it to a human. Confirms status, content type, byte count, and file header, and states expiry honestly. Use before delivering any download, deploy URL, or shared link.
---

# Link Proof

A link that was never fetched is a promise, not a deliverable. Temporary domains
expire, uploads truncate, and the user standing in front of a 403 blames the work,
not the wire. This skill makes every delivered link a verified fact.

## Workflow

1. **Fetch fully, never just the head.** Download the entire resource. Record:
   HTTP status, content type, exact byte count, and the first bytes of the body.
2. **Match the header to the format.** MP4 must start with the ftyp box, PNG with
   its signature, ZIP with PK. A video content type with a wrong header is an
   error page in disguise.
3. **Match the byte count to the source.** The downloaded size must equal the
   produced file size exactly. A truncated download is a fail.
4. **State the expiry in writing.** Temporary hosts die silently. Every link is
   delivered with its expected lifetime and a note on where the master file lives.
5. **Never ship from a host that failed once this session.** One 403 from a host
   moves delivery to a verified alternative for the rest of the task.
6. **Re-verify on request.** If a user reports a dead link, re-fetch before
   re-uploading; the old URL may simply have expired on schedule.

## Output contract
- VERIFIED LINKS: table of URL, status, content type, bytes, header check.
- EXPIRY: expected lifetime per link.
- MASTER: where the original file lives if the link dies.

## Rules
- A link you have not fetched in full is unverified; label it so.
- Status 200 with the wrong bytes is a fail, not a pass.
- Never offer a link you would not click yourself.
