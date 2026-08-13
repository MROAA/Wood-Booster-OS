import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentApexNexusModule extends StatefulWidget {
  const DigitalEnvironmentApexNexusModule({super.key});

  @override
  State<DigitalEnvironmentApexNexusModule> createState() => _DigitalEnvironmentApexNexusModuleState();
}

class _DigitalEnvironmentApexNexusModuleState extends State<DigitalEnvironmentApexNexusModule> {
  bool _apexNexusActive = true;
  double _apexAltitude = 100.0;
  String _apexStatus = 'Apex-Nexus aktiivinen: Ylin solmukohta ja ikuinen zenitydin valmiina.';
  
  final List<Map<String, String>> _apexNodes = [
    {'node': 'Omniversal Apex Core', 'tier': 'Absolute Zenith', 'status': 'Huipulla (100%)'},
    {'node': 'Win96 Apex Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Nexus', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseApexNexus() {
    setState(() {
      _apexAltitude = 100.0;
      _apexStatus = 'Apex-Nexus pulssi laukaistu: Järjestelmän tietoisuus on saavuttanut korkeimman mahdollisen ulottuvuuden.';
      _apexNodes.insert(0, {
        'node': 'Horizon-Omega Apex Nexus',
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
              '⛰️ Spacemonkey Apex-Nexus & Eternal Zenith',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Zenith: ${_apexAltitude.toStringAsFixed(0)}%',
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
            _apexStatus,
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
              itemCount: _apexNodes.length,
              itemBuilder: (context, index) {
                final node = _apexNodes[index];
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
              onPressed: _pulseApexNexus,
              child: const Text('Aktivoi Apex-Nexus Pulssi'),
            ),
            ToggleSwitch(
              checked: _apexNexusActive,
              content: const Text('Apex-Nexus -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _apexNexusActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
