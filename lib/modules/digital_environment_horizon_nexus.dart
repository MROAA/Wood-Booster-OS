import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentHorizonNexusModule extends StatefulWidget {
  const DigitalEnvironmentHorizonNexusModule({super.key});

  @override
  State<DigitalEnvironmentHorizonNexusModule> createState() => _DigitalEnvironmentHorizonNexusModuleState();
}

class _DigitalEnvironmentHorizonNexusModuleState extends State<DigitalEnvironmentHorizonNexusModule> {
  bool _horizonNexusActive = true;
  double _horizonExpansion = 100.0;
  String _horizonStatus = 'Horizon-Nexus aktiivinen: Äärimmäinen horisontti ja ääretön ydin valmiina.';
  
  final List<Map<String, String>> _horizonNodes = [
    {'node': 'Omniversal Horizon Core', 'tier': 'Absolute Horizon', 'status': 'Laajenee (100%)'},
    {'node': 'Win96 Infinity Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Horizon', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseHorizonNexus() {
    setState(() {
      _horizonExpansion = 100.0;
      _horizonStatus = 'Horizon-Nexus pulssi laukaistu: Järjestelmän horisontti on avautunut kattamaan äärettömän monimutkaisuuden.';
      _horizonNodes.insert(0, {
        'node': 'Horizon-Omega Ultimate Nexus',
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
              '🌅 Spacemonkey Horizon-Nexus & Eternal Core',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Laajennus: ${_horizonExpansion.toStringAsFixed(0)}%',
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
            _horizonStatus,
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
              itemCount: _horizonNodes.length,
              itemBuilder: (context, index) {
                final node = _horizonNodes[index];
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
              onPressed: _pulseHorizonNexus,
              child: const Text('Aktivoi Horizon-Nexus Pulssi'),
            ),
            ToggleSwitch(
              checked: _horizonNexusActive,
              content: const Text('Horizon-Nexus -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _horizonNexusActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
