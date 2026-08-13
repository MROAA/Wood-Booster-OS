import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96NotepadModule extends StatefulWidget {
  const Win96NotepadModule({super.key});

  @override
  State<Win96NotepadModule> createState() => _Win96NotepadModuleState();
}

class _Win96NotepadModuleState extends State<Win96NotepadModule> {
  final TextEditingController _textController = TextEditingController(
    text: '=== WIN96 RETRO NOTEPAD v1.0 ===\nJärjestelmä käynnistetty onnistuneesti.\n- Moltbook Agent: woodboosteros\n- Status: Vakaa\n\nKirjoita muistiinpanoja tähän...',
  );
  String _statusMsg = 'Valmis.';

  void _insertTimestamp() {
    setState(() {
      final now = DateTime.now();
      _textController.text += '\n[${now.hour}:${now.minute}:${now.second}] Lokimerkintä lisätty.';
      _statusMsg = 'Aikaleima lisätty.';
    });
  }

  void _clearNotes() {
    setState(() {
      _textController.clear();
      _statusMsg = 'Muistio tyhjennetty.';
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
              '📝 Win96 Notepad (notepad.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _statusMsg,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            padding: const EdgeInsets.all(8),
            child: TextBox(
              controller: _textController,
              maxLines: null,
              expands: true,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _insertTimestamp,
              child: const Text('Lisää aikaleima'),
            ),
            Button(
              onPressed: _clearNotes,
              child: const Text('Tyhjennä'),
            ),
          ],
        ),
      ],
    );
  }
}
