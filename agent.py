from anthropic import Anthropic

client = Anthropic()

session = client.beta.sessions.create(
    agent={"type": "agent", "id": "agent_018LCGNCifQt47yXKRrWzVCi"},
    environment_id="env_01Hu3ogyWck6dZBzJppczDS2",
)

with client.beta.sessions.events.stream(
    session_id=session.id,
) as stream:
    client.beta.sessions.events.send(
        session_id=session.id,
        events=[
            {
                "type": "user.message",
                "content": [{"type": "text", "text": "Research the current state of AI regulation in the EU and summarize the key points in a short report."}],
            },
        ],
    )

    for event in stream:
        if event.type == "agent.message":
            for block in event.content:
                print(block.text, end="")
        elif event.type == "agent.tool_use":
            print(f"\n[Using tool: {event.name}]")
        elif event.type == "session.status_idle":
            print("\n\nAgent finished.")
            break
