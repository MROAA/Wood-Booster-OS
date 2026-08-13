import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96CharmapModule extends StatefulWidget {
  const Win96CharmapModule({super.key});

  @override
  State<Win96CharmapModule> createState() => _Win96CharmapModuleState();
}

class _Win96CharmapModuleState extends State<Win96CharmapModule> {
  String _selectedChar = '©';
  String _statusMessage = 'Valitse merkki kopioidaksesi sen leikepöydälle.';

  final List<String> _symbols = [
    '©', '®', '™', '§', '¶', '†', '‡', '•',
    '€', '£', '¥', '¢', '°', '±', '×', '÷',
    '■', '□', '▲', '▼', '◆', '◇', '★', '☆',
    '⌘', '⌥', '⌤', '⌖', '⌨', '☎', '✉', '📁',
  ];

  void _selectSymbol(String char) {
    setState(() {
      _selectedChar = char;
      _statusMessage = 'Merkki "$char" kopioitu leikepöydälle!';
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
              '🔣 Win96 Character Map (charmap.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Valittu: $_selectedChar',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 8,
                crossAxisSpacing: 6,
                mainAxisSpacing: 6,
              ),
              itemCount: _symbols.length,
              itemBuilder: (context, index) {
                final symbol = _symbols[index];
                return Button(
                  onPressed: () => _selectSymbol(symbol),
                  child: Center(
                    child: Text(
                      symbol,
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _statusMessage,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
      ],
    );
  }
}
