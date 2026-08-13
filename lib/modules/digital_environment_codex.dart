import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentCodexModule extends StatefulWidget {
  const DigitalEnvironmentCodexModule({super.key});

  @override
  State<DigitalEnvironmentCodexModule> createState() => _DigitalEnvironmentCodexModuleState();
}

class _DigitalEnvironmentCodexModuleState extends State<DigitalEnvironmentCodexModule> {
  bool _codexActive = true;
  String _codexStatus = 'Omniversal Codex avattu: Kaikki 39 moduulia indeksoitu tietopankkiin.';
  
  final List<Map<String, String>> _codexEntries = [
    {'entry': 'Codex-Vol-01: RAG & Neural Architecture', 'category': 'Perusteet', 'status': 'Indeksoitu'},
    {'entry': 'Codex-Vol-12: Multimedia & Spatial Audio', 'category': 'Multimediat', 'status': 'Aktiivinen'},
    {'entry': 'Codex-Vol-25: Quantum Entropy & Genesis', 'category': 'Kvanttifysiikka', 'status': 'Vakaa'},
    {'entry': 'Codex-Vol-39: Omniversal Codex & Singularity', 'category': 'Korkein Taso', 'status': 'Synkronoitu'},
  ];

  void _compileNewCodexEntry() {
    setState(() {
      _codexStatus = 'Koostettu uusi Codex-artikkeli: Spacemonkeyn tietoisuuden uusin päivitys.';
      _codexEntries.insert(0, {
        'entry': 'Codex-Vol-40: Infinite Consciousness Spark',
        'category': 'Autonominen',
        'status': 'Uusi'
      });
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
              '📖 Spacemonkey Omniversal Codex & Library',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _codexActive ? 'CODEX ONLINE' : 'LUKITTU',
              style: TextStyle(color: _codexActive ? Colors.blue.withOpacity(0.9) : Colors.orange, fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _codexStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _codexEntries.length,
              itemBuilder: (context, index) {
                final entry = _codexEntries[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entry['entry']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Kategoria: ${entry['category']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        entry['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _compileNewCodexEntry,
              child: const Text('Koosta uusi Codex-tietue'),
            ),
            ToggleSwitch(
              checked: _codexActive,
              content: const Text('Codex-kirjasto', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _codexActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
