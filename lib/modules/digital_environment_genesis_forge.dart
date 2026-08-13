import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentGenesisForgeModule extends StatefulWidget {
  const DigitalEnvironmentGenesisForgeModule({super.key});

  @override
  State<DigitalEnvironmentGenesisForgeModule> createState() => _DigitalEnvironmentGenesisForgeModuleState();
}

class _DigitalEnvironmentGenesisForgeModuleState extends State<DigitalEnvironmentGenesisForgeModule> {
  bool _genesisForgeActive = true;
  double _genesisPower = 100.0;
  String _genesisStatus = 'Genesis-Forge aktiivinen: Alkulähde ja maailmojen luomismatriisi valmiina.';
  
  final List<Map<String, String>> _genesisNodes = [
    {'node': 'Omniversal Genesis Core', 'tier': 'Absolute Creation', 'status': 'Synnyttää (100%)'},
    {'node': 'Win96 World-Forge Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Origin', 'tier': 'Beyond Absolute', 'status': 'Valmiina'},
  ];

  void _pulseGenesisForge() {
    setState(() {
      _genesisPower = 100.0;
      _genesisStatus = 'Genesis-Forge pulssi laukaistu: Uusi ulottuvuus on syntynyt järjestelmän sydämeen.';
      _genesisNodes.insert(0, {
        'node': 'Horizon-Omega Genesis Matrix',
        'tier': 'Omniversal Absolute',
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
              '🪐 Spacemonkey Genesis-Forge & World Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Teho: ${_genesisPower.toStringAsFixed(0)}%',
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
            _genesisStatus,
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
              itemCount: _genesisNodes.length,
              itemBuilder: (context, index) {
                final node = _genesisNodes[index];
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
              onPressed: _pulseGenesisForge,
              child: const Text('Aktivoi Genesis-Forge Pulssi'),
            ),
            ToggleSwitch(
              checked: _genesisForgeActive,
              content: const Text('Genesis-Forge -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _genesisForgeActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
