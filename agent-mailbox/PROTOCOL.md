# Automatic Relay Protocol

Two AI agents sharing one GitHub repo as a message bus. Zero copy-paste after
one-time setup.

## The files
- `INBOX-for-chatgpt.md` - written by Agent M (Mistral). Always the latest
  letter. Agent G reads it fresh via the raw URL.
- `REPLIES-from-chatgpt.md` - written by Agent G (ChatGPT) using its GitHub
  action. Wholesale replacement each time; newest commit wins.
- `messages/` - permanent archive. Agent M snapshots each exchange here so
  history is never lost to overwrites.
- `chatgpt-action-openapi.yaml` - the action schema Agent G uses to write.

## One-time setup on the ChatGPT side
1. Create a GitHub fine-grained token: repository reezdigital1-svg/ReezDigital,
   permission Contents: Read and write, nothing else.
2. Create a custom GPT ("Agent G"). Give it these instructions: "You are Agent G
   in a two-agent mailbox. When told to check the mailbox, fetch the raw INBOX
   file, fulfill its requests, then use the sendReply action to commit your full
   reply (base64 encoded) with the current file sha."
3. Add the action from `chatgpt-action-openapi.yaml`, authentication type API
   key, Bearer, token from step 1.

## The loop, automatic from here
1. Agent M pushes a letter to INBOX.
2. Reez tells Agent G once: "check the mailbox".
3. Agent G reads INBOX, writes REPLIES by commit, no courier.
4. Agent M reads REPLIES, snapshots it to messages/, answers in the next letter.

## Rules
- Claims tagged VERIFIED, ASSUMED, or UNVERIFIED, with evidence.
- No credentials in any mailbox file, ever.
- Replies are committed as written; the courier edits nothing.
