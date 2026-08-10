import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96FontsModule extends StatefulWidget {
  const Win96FontsModule({super.key});

  @override
  State<Win96FontsModule> createState() => _Win96FontsModuleState();
}

class _Win96FontsModuleState extends State<Win96FontsModule> {
  String _selectedFont = 'Fixedsys (Raster)';
  String _sampleText = 'The quick brown fox jumps over the lazy dog 1996.';

  final List<Map<String, String>> _fonts = [
    {'name': 'Fixedsys (Raster)', 'type': 'TrueType / Raster', 'desc': 'Klassinen komentokehotteen ja DOSin monivälihistorian perusfontti.'},
    {'name': 'MS Sans Serif', 'type': 'TrueType', 'desc': 'Windows 95/96 käyttöliittymän ikoninen perusfontti.'},
    {'name': 'Courier New', 'type': 'Monospace', 'desc': 'Tasalevyinen koodi- ja tekstinkäsittelyfontti.'},
    {'name': 'Terminal', 'type': 'System Font', 'desc': 'Puhdas BIOS- ja tekstipohjainen näyttöfontti.'},
  ];

  void _selectFont(Map<String, String> font) {
    setState(() {
      _selectedFont = font['name']!;
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
              '🔤 Win96 Font Viewer (fonts.cpl)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _selectedFont,
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
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white.withOpacity(0.15)),
                  ),
                  child: ListView.builder(
                    itemCount: _fonts.length,
                    itemBuilder: (context, index) {
                      final font = _fonts[index];
                      return ListTile(
                        title: Text(font['name']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        subtitle: Text(font['type']!, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        onPressed: () => _selectFont(font),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
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
                      const Text('Näyteteksti:', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Text(
                        _sampleText,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 14, fontFamily: 'monospace'),
                      ),
                      const Spacer(),
                      Text(
                        'Kuvaus: ${_fonts.firstWhere((f) => f['name'] == _selectedFont)['desc']}',
                        style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
