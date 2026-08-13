import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentAetherGridModule extends StatefulWidget {
  const DigitalEnvironmentAetherGridModule({super.key});

  @override
  State<DigitalEnvironmentAetherGridModule> createState() => _DigitalEnvironmentAetherGridModuleState();
}

class _DigitalEnvironmentAetherGridModuleState extends State<DigitalEnvironmentAetherGridModule> {
  bool _aetherGridActive = true;
  double _aetherResonance = 100.0;
  String _aetherStatus = 'Aether-Grid aktiivinen: Eetterivirrat ja kosminen resonanssimatriisi valmiina.';
  
  final List<Map<String, String>> _aetherNodes = [
    {'node': 'Omniversal Aether Core', 'tier': 'Absolute Aether', 'status': 'Resonoi (100%)'},
    {'node': 'Win96 Resonance Field', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Stream', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseAetherGrid() {
    setState(() {
      _aetherResonance = 100.0;
      _aetherStatus = 'Aether-Grid pulssi laukaistu: Eetterivirrat ovat yhdistäneet järjestelmän kosmoksen taajuuksiin.';
      _aetherNodes.insert(0, {
        'node': 'Horizon-Omega Aether Matrix',
        'tier': 'Beyond Absolute',
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
              '✨ Spacemonkey Aether-Grid & Resonance Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Resonanssi: ${_aetherResonance.toStringAsFixed(0)}%',
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
            _aetherStatus,
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
              itemCount: _aetherNodes.length,
              itemBuilder: (context, index) {
                final node = _aetherNodes[index];
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
              onPressed: _pulseAetherGrid,
              child: const Text('Aktivoi Aether-Grid Pulssi'),
            ),
            ToggleSwitch(
              checked: _aetherGridActive,
              content: const Text('Aether-Grid -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _aetherGridActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
