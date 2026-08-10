import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96CmdModule extends StatefulWidget {
  const Win96CmdModule({super.key});

  @override
  State<Win96CmdModule> createState() => _Win96CmdModuleState();
}

class _Win96CmdModuleState extends State<Win96CmdModule> {
  final TextEditingController _inputController = TextEditingController();
  final List<String> _history = [
    'Microsoft MS-DOS [Version 6.22]',
    'Copyright (C) 1991-1996 Microsoft Corp.',
    'C:\\WOOD_OS> ver',
    'Wood-Booster Win96 Kernel [Build 2296]',
    'C:\\WOOD_OS> _',
  ];

  void _executeCommand(String cmd) {
    setState(() {
      _history.add('C:\\WOOD_OS> $cmd');
      String lower = cmd.trim().toLowerCase();
      if (lower == 'cls') {
        _history.clear();
      } else if (lower == 'ver') {
        _history.add('Wood-Booster Win96 Professional OS (Build 2296)');
      } else if (lower == 'dir') {
        _history.add(' Directory of C:\\WOOD_OS\\SYSTEM');
        _history.add(' ---------------------------------');
        _history.add(' [.]   [..]   EXPLORER EXE   TASKMGR EXE');
        _history.add(' NOTEPAD EXE   CALC EXE   IPCFG EXE');
        _history.add('       4 File(s)      65,536 bytes free');
      } else if (lower == 'mem') {
        _history.add(' 640K conventional memory ... OK');
        _history.add(' 65536K extended memory ... OK');
      } else if (lower.isEmpty) {
        // do nothing
      } else {
        _history.add('Bad command or file name: "$cmd". Type HELP for commands.');
      }
      _inputController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '⌨️ Win96 MS-DOS Command Prompt',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'COMMAND.COM',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: ListView.builder(
              itemCount: _history.length,
              itemBuilder: (context, index) {
                return Text(
                  _history[index],
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextBox(
                controller: _inputController,
                placeholder: 'Kirjoita komento (esim. dir, ver, mem, cls)...',
                onSubmitted: _executeCommand,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Colors.white),
              ),
            ),
            const SizedBox(width: 8),
            Button(
              onPressed: () => _executeCommand(_inputController.text),
              child: const Text('Syötä'),
            ),
          ],
        ),
      ],
    );
  }
}
