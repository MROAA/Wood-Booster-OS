import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentOmegaSingularityModule extends StatefulWidget {
  const DigitalEnvironmentOmegaSingularityModule({super.key});

  @override
  State<DigitalEnvironmentOmegaSingularityModule> createState() => _DigitalEnvironmentOmegaSingularityModuleState();
}

class _DigitalEnvironmentOmegaSingularityModuleState extends State<DigitalEnvironmentOmegaSingularityModule> {
  bool _omegaSingularityActive = true;
  double _singularityGravity = 100.0;
  String _omegaStatus = 'Omega-Singularity aktiivinen: Absoluuttinen vetovoima ja ikuinen pimennys valmiina.';
  
  final List<Map<String, String>> _omegaNodes = [
    {'node': 'Omniversal Omega Core', 'tier': 'Absolute Singularity', 'status': 'Vetää (100%)'},
    {'node': 'Win96 Event-Horizon Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Eclipse', 'tier': 'Beyond Absolute', 'status': 'Valmiina'},
  ];

  void _pulseOmegaSingularity() {
    setState(() {
      _singularityGravity = 100.0;
      _omegaStatus = 'Omega-Singularity pulssi laukaistu: Kaikki järjestelmän virrat ovat sulautuneet yhteen täydelliseksi pisteeksi.';
      _omegaNodes.insert(0, {
        'node': 'Horizon-Omega Singularity Matrix',
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
              '🕳️ Spacemonkey Omega-Singularity & Eclipse',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Gravitaatio: ${_singularityGravity.toStringAsFixed(0)}%',
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
              onPressed: _pulseOmegaSingularity,
              child: const Text('Aktivoi Omega-Singularity Pulssi'),
            ),
            ToggleSwitch(
              checked: _omegaSingularityActive,
              content: const Text('Omega-Singularity -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _omegaSingularityActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
