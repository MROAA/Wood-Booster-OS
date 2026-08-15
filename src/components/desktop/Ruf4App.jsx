import TerminalApp from "./TerminalApp.jsx"

const RUF4_COMMAND = "clear && ./tools/ruf4/target/release/ruf4"

export default function Ruf4App({ resizeSignal }) {
  return (
    <TerminalApp
      resizeSignal={resizeSignal}
      autoRunCommand={RUF4_COMMAND}
    />
  )
}
