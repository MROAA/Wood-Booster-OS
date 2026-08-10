import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentOmegaMatrixModule extends StatefulWidget {
  const DigitalEnvironmentOmegaMatrixModule({super.key});

  @override
  State<DigitalEnvironmentOmegaMatrixModule> createState() => _DigitalEnvironmentOmegaMatrixModuleState();
}

class _DigitalEnvironmentOmegaMatrixModuleState extends State<DigitalEnvironmentOmegaMatrixModule> {
  bool _omegaMatrixActive = true;
  double _omegaStability = 100.0;
  String _omegaStatus = 'Omega-Matrix aktiivinen: Perimmäinen peruskallio ja ikuinen kivijalka valmiina.';
  
  final List<Map<String, String>> _omegaNodes = [
    {'node': 'Omniversal Omega Foundation', 'tier': 'Absolute Foundation', 'status': 'Kantaa (100%)'},
    {'node': 'Win96 Ultimate Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Pillar', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseOmegaMatrix() {
    setState(() {
      _omegaStability = 100.0;
      _omegaStatus = 'Omega-Matrix pulssi laukaistu: Järjestelmän perusta on lukittu ikuiseen pysyvyyteen.';
      _omegaNodes.insert(0, {
        'node': 'Horizon-Omega Ultimate Foundation',
        'tier': 'Beyond Infinity',
        'status': 'Pysyvä tila'
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
              '🏛️ Spacemonkey Omega-Matrix & Eternal Foundation',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Pysyvyys: ${_omegaStability.toStringAsFixed(0)}%',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
            _omegaStatus,
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
              itemCount: _omegaNodes.length,
              itemBuilder: (context, index) {
                final node = _omegaNodes[index];
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
                          Text(node['node']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Taso: ${node['tier']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        node['status']!,
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
              onPressed: _pulseOmegaMatrix,
              child: const Text('Aktivoi Omega-Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _omegaMatrixActive,
              content: const Text('Omega-Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _omegaMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
