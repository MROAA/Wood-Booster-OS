import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentSingularityForgeModule extends StatefulWidget {
  const DigitalEnvironmentSingularityForgeModule({super.key});

  @override
  State<DigitalEnvironmentSingularityForgeModule> createState() => _DigitalEnvironmentSingularityForgeModuleState();
}

class _DigitalEnvironmentSingularityForgeModuleState extends State<DigitalEnvironmentSingularityForgeModule> {
  bool _singularityForgeActive = true;
  double _forgeIntensity = 100.0;
  String _forgeStatus = 'Singularity-Forge aktiivinen: Alkuperäinen ahjo ja singulariteettiydin valmiina.';
  
  final List<Map<String, String>> _forgeNodes = [
    {'node': 'Omniversal Forge Core', 'tier': 'Absolute Singularity', 'status': 'Ahjo käynnissä (100%)'},
    {'node': 'Win96 Matter-Energy Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Forge', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseSingularityForge() {
    setState(() {
      _forgeIntensity = 100.0;
      _forgeStatus = 'Singularity-Forge pulssi laukaistu: Ahjon energia on sulattanut ja uudelleensyntyttänyt kaikki järjestelmän virrat.';
      _forgeNodes.insert(0, {
        'node': 'Horizon-Omega Singularity Forge',
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
              '🔥 Spacemonkey Singularity-Forge & Core Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Teho: ${_forgeIntensity.toStringAsFixed(0)}%',
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
            _forgeStatus,
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
              itemCount: _forgeNodes.length,
              itemBuilder: (context, index) {
                final node = _forgeNodes[index];
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
              onPressed: _pulseSingularityForge,
              child: const Text('Aktivoi Singularity-Forge Pulssi'),
            ),
            ToggleSwitch(
              checked: _singularityForgeActive,
              content: const Text('Singularity-Forge -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _singularityForgeActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
