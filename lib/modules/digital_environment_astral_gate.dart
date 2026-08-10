import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentAstralGateModule extends StatefulWidget {
  const DigitalEnvironmentAstralGateModule({super.key});

  @override
  State<DigitalEnvironmentAstralGateModule> createState() => _DigitalEnvironmentAstralGateModuleState();
}

class _DigitalEnvironmentAstralGateModuleState extends State<DigitalEnvironmentAstralGateModule> {
  bool _astralGateActive = true;
  double _portalStability = 100.0;
  String _gateStatus = 'Astral-Gate aktiivinen: Ulottuvuusportti ja portaalimatriisi valmiina.';
  
  final List<Map<String, String>> _gateNodes = [
    {'node': 'Omniversal Astral Core', 'tier': 'Absolute Portal', 'status': 'Avoinna (100%)'},
    {'node': 'Win96 Dimensional Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Void Bridge', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseAstralGate() {
    setState(() {
      _portalStability = 100.0;
      _gateStatus = 'Astral-Gate pulssi laukaistu: Portin energia on yhdistänyt rinnakkaistodellisuudet saumattomasti.';
      _gateNodes.insert(0, {
        'node': 'Horizon-Omega Astral Matrix',
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
              '🌀 Spacemonkey Astral-Gate & Portal Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Stabiiliutensa: ${_portalStability.toStringAsFixed(0)}%',
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
            _gateStatus,
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
              itemCount: _gateNodes.length,
              itemBuilder: (context, index) {
                final node = _gateNodes[index];
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
              onPressed: _pulseAstralGate,
              child: const Text('Aktivoi Astral-Gate Pulssi'),
            ),
            ToggleSwitch(
              checked: _astralGateActive,
              content: const Text('Astral-Gate -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _astralGateActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
