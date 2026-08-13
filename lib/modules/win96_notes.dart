import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96NotesModule extends StatefulWidget {
  const Win96NotesModule({super.key});

  @override
  State<Win96NotesModule> createState() => _Win96NotesModuleState();
}

class _Win96NotesModuleState extends State<Win96NotesModule> {
  final TextEditingController _noteController = TextEditingController(
    text: 'Muista ostaa uusia levykkeitä (3.5 HD) ja tarkistaa Wood-Booster koodit!',
  );

  void _clearNote() {
    setState(() {
      _noteController.clear();
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
              '📝 Win96 Sticky Notes (notepads.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Memo #1',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF275), // Retrokeltainen muistilappu
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.black26),
            ),
            child: TextBox(
              controller: _noteController,
              maxLines: null,
              style: const TextStyle(color: Colors.black, fontSize: 13, fontFamily: 'monospace'),
              decoration: BoxDecoration(color: Colors.transparent),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _clearNote,
          child: const Text('Tyhjennä muistilappu'),
        ),
      ],
    );
  }
}
