import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96ClipboardModule extends StatefulWidget {
  const Win96ClipboardModule({super.key});

  @override
  State<Win96ClipboardModule> createState() => _Win96ClipboardModuleState();
}

class _Win96ClipboardModuleState extends State<Win96ClipboardModule> {
  String _clipboardContent = 'Wood-Booster Win96 Core Object [Format: CF_TEXT]';
  final List<String> _history = [
    'Wood-Booster Win96 Core Object [Format: CF_TEXT]',
    'C:\\WOOD_OS\\SYSTEM\\EXPLORER.EXE',
    'PINBALL_3D_DX High Score: 54200 pts',
  ];

  void _clearClipboard() {
    setState(() {
      _clipboardContent = '[Leikepöytä tyhjä]';
    });
  }

  void _selectHistory(String item) {
    setState(() {
      _clipboardContent = item;
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
              '📋 Win96 Clipboard Viewer (clipbrd.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'CF_TEXT',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Row(
            children: [
              Expanded(
                flex: 1,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Leikepöydän nykyinen sisältö:', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Text(
                        _clipboardContent,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white.withOpacity(0.15)),
                  ),
                  child: ListView.builder(
                    itemCount: _history.length,
                    itemBuilder: (context, index) {
                      final entry = _history[index];
                      return ListTile(
                        title: Text(entry, style: const TextStyle(color: Colors.white, fontSize: 11)),
                        onPressed: () => _selectHistory(entry),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _clearClipboard,
          child: const Text('Tyhjennä leikepöytä'),
        ),
      ],
    );
  }
}
