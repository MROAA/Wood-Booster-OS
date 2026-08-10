import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentStellarCoreModule extends StatefulWidget {
  const DigitalEnvironmentStellarCoreModule({super.key});

  @override
  State<DigitalEnvironmentStellarCoreModule> createState() => _DigitalEnvironmentStellarCoreModuleState();
}

class _DigitalEnvironmentStellarCoreModuleState extends State<DigitalEnvironmentStellarCoreModule> {
  bool _stellarCoreActive = true;
  double _stellarEnergy = 100.0;
  String _stellarStatus = 'Stellar-Core aktiivinen: Tähtitason voimanlähde ja supernova-matriisi valmiina.';
  
  final List<Map<String, String>> _stellarNodes = [
    {'node': 'Omniversal Stellar Core', 'tier': 'Absolute Supernova', 'status': 'Säteilee (100%)'},
    {'node': 'Win96 Plasma Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Sun', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseStellarCore() {
    setState(() {
      _stellarEnergy = 100.0;
      _stellarStatus = 'Stellar-Core pulssi laukaistu: Supernovan energia virtaa läpi koko järjestelmän.';
      _stellarNodes.insert(0, {
        'node': 'Horizon-Omega Stellar Matrix',
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
              '🌟 Spacemonkey Stellar-Core & Supernova Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Energia: ${_stellarEnergy.toStringAsFixed(0)}%',
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
            _stellarStatus,
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
              itemCount: _stellarNodes.length,
              itemBuilder: (context, index) {
                final node = _stellarNodes[index];
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
              onPressed: _pulseStellarCore,
              child: const Text('Aktivoi Stellar-Core Pulssi'),
            ),
            ToggleSwitch(
              checked: _stellarCoreActive,
              content: const Text('Stellar-Core -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _stellarCoreActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
