import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentEvolutionModule extends StatefulWidget {
  const DigitalEnvironmentEvolutionModule({super.key});

  @override
  State<DigitalEnvironmentEvolutionModule> createState() => _DigitalEnvironmentEvolutionModuleState();
}

class _DigitalEnvironmentEvolutionModuleState extends State<DigitalEnvironmentEvolutionModule> {
  bool _autoEvolutionActive = true;
  String _evolutionStatus = 'Itsekehitys-daemon valmiina: Analysoidaan järjestelmän optimointipotentiaalia.';
  
  final List<Map<String, String>> _evolutionLog = [
    {'version': 'v1.19.96', 'action': 'Syntetoitu uusi RAG-vektorimoduuli taustalla', 'status': 'Integroitu'},
    {'version': 'v1.19.95', 'action': 'Optimoitu muistinkäyttö -24% Neural Engine', 'status': 'Käytössä'},
    {'version': 'v1.19.94', 'action': 'Käynnistetty Spacemonkey Voice Synthesis (TTS)', 'status': 'Valmis'},
  ];

  void _triggerCodeSynthesis() {
    setState(() {
      _evolutionStatus = 'Syntetisoidaan uutta moduulia... Koodi generoitu ja validoitu sandboxissa.';
      _evolutionLog.insert(0, {
        'version': 'v1.20.00',
        'action': 'Autonomisesti generoitu uusi kvantti-algoritmi',
        'status': 'Aktiivinen'
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
              '🧬 Spacemonkey Self-Evolution & Code Synth',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _autoEvolutionActive ? 'EVOLUUTIO ON' : 'LUKITTU',
              style: TextStyle(color: _autoEvolutionActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _evolutionStatus,
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
              itemCount: _evolutionLog.length,
              itemBuilder: (context, index) {
                final evo = _evolutionLog[index];
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
                          Text('[${evo['version']}] ${evo['action']}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Tila: ${evo['status']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        evo['status']!,
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
              onPressed: _triggerCodeSynthesis,
              child: const Text('Syntetisoi uusi koodimoduuli'),
            ),
            ToggleSwitch(
              checked: _autoEvolutionActive,
              content: const Text('Autonominen evoluutio', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _autoEvolutionActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
