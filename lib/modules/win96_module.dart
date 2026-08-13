import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';
import 'dart:math';

class Win96Module extends StatefulWidget {
  const Win96Module({super.key});

  @override
  State<Win96Module> createState() => _Win96ModuleState();
}

class _Win96ModuleState extends State<Win96Module> {
  String _consoleOutput = 'WIN96-DOS v4.02 [Core Kernel Active]\nKirjoita tai valitse alta toiminto...';
  double _systemLoad = 12.4;
  final TextEditingController _cmdController = TextEditingController();

  void _runCommand(String cmd) {
    setState(() {
      String input = cmd.toLowerCase().trim();
      if (input == 'help') {
        _consoleOutput += '\n> help\nKomennot: dir, ver, matrix, clear, bonus';
      } else if (input == 'dir') {
        _consoleOutput += '\n> dir\nC:\\WIN96\\SYSTEM\nC:\\WOOD\\MODULES\nC:\\GAMES\\PINBALL.EXE';
      } else if (input == 'ver') {
        _consoleOutput += '\n> ver\nWindows 96 Chicago Wood-Edition (Build 2296)';
      } else if (input == 'matrix') {
        _consoleOutput += '\n> matrix\nWake up, Wood-Booster... Follow the white rabbit 🐇';
      } else if (input == 'bonus') {
        _consoleOutput += '\n> bonus\nRetro-musiikkisyntikka latautui! (pii-pau-pöö)';
      } else if (input == 'clear') {
        _consoleOutput = 'WIN96-DOS v4.02 [Puhdistettu]';
      } else {
        _consoleOutput += '\nTuntematon komento: "$cmd". Kirjoita "help".';
      }
      _systemLoad = (Random().nextDouble() * 20 + 10);
    });
    _cmdController.clear();
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
              '🪟 Windows 96 Advanced Sub-System',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'CPU: ${_systemLoad.toStringAsFixed(1)}%',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: SingleChildScrollView(
              child: Text(
                _consoleOutput,
                style: TextStyle(color: Colors.blue.withOpacity(0.9), fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextBox(
                controller: _cmdController,
                placeholder: 'Syötä Win96 komento (esim. help, matrix, dir)...',
                onSubmitted: (val) => _runCommand(val),
              ),
            ),
            const SizedBox(width: 8),
            Button(
              onPressed: () => _runCommand(_cmdController.text),
              child: const Text('Aja'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: () => _runCommand('help'),
              child: const Text('Ohje (help)'),
            ),
            Button(
              onPressed: () => _runCommand('matrix'),
              child: const Text('Matrix'),
            ),
            Button(
              onPressed: () => _runCommand('clear'),
              child: const Text('Tyhjennä'),
            ),
          ],
        ),
      ],
    );
  }
}
