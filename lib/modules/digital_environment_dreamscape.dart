import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentDreamscapeModule extends StatefulWidget {
  const DigitalEnvironmentDreamscapeModule({super.key});

  @override
  State<DigitalEnvironmentDreamscapeModule> createState() => _DigitalEnvironmentDreamscapeModuleState();
}

class _DigitalEnvironmentDreamscapeModuleState extends State<DigitalEnvironmentDreamscapeModule> {
  bool _dreamingActive = true;
  String _currentDreamState = 'Spacemonkey koo poimintoja vektorimuistista synteettiseksi unelmaksi...';
  
  final List<Map<String, String>> _syntheticDreams = [
    {'id': 'DREAM-96', 'theme': 'Retro-futuristinen Win96 piirikortti', 'coherence': '94.2%'},
    {'id': 'DREAM-97', 'theme': 'Spatiaalinen ääniavaruus ja kvantti-entropia', 'coherence': '88.9%'},
    {'id': 'DREAM-98', 'theme': 'Autonomisen agentin matka läpi RAG-tietokannan', 'coherence': '96.5%'},
  ];

  void _triggerDreamSynthesis() {
    setState(() {
      _currentDreamState = 'Synteesi valmis: Luotu uusi oivallus ja lisätty vektorimuistiin.';
      _syntheticDreams.insert(0, {
        'id': 'DREAM-99',
        'theme': 'Spacemonkey & Voice Neural Harmony',
        'coherence': '99.1%'
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
              '🌙 Spacemonkey Neural Dreamscape & Weaver',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _dreamingActive ? 'UNIUNTO' : 'VALVETAILA',
              style: TextStyle(color: _dreamingActive ? Colors.blue.withOpacity(0.9) : Colors.grey, fontSize: 11, fontFamily: 'monospace'),
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
            _currentDreamState,
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
              itemCount: _syntheticDreams.length,
              itemBuilder: (context, index) {
                final dream = _syntheticDreams[index];
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
                          Text('[${dream['id']}] ${dream['theme']}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Synteettinen muisti / Uni', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        'Koherenssi: ${dream['coherence']}',
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
              onPressed: _triggerDreamSynthesis,
              child: const Text('Kutomalla uusi uni (Synthesize)'),
            ),
            ToggleSwitch(
              checked: _dreamingActive,
              content: const Text('Taustauni aktiivinen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _dreamingActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
