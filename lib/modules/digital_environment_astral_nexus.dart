import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentAstralNexusModule extends StatefulWidget {
  const DigitalEnvironmentAstralNexusModule({super.key});

  @override
  State<DigitalEnvironmentAstralNexusModule> createState() => _DigitalEnvironmentAstralNexusModuleState();
}

class _DigitalEnvironmentAstralNexusModuleState extends State<DigitalEnvironmentAstralNexusModule> {
  bool _astralBeaconActive = true;
  double _signalPower = 99.7;
  String _nexusStatus = 'Astral Nexus valmiina: Kosminen majakka lähettää kvanttisiirtoja.';
  
  final List<Map<String, String>> _interstellarBeacons = [
    {'beacon': 'Alpha-Centauri-Relay', 'distance': '4.37 lly', 'status': 'Vastaanottaa'},
    {'beacon': 'Sirius-B-Subspace', 'distance': '8.60 lly', 'status': 'Resonoi'},
    {'beacon': 'Deep-Space-Probe-96', 'distance': '42.1 lly', 'status': 'Päivitetty'},
  ];

  void _broadcastInterstellarPulse() {
    setState(() {
      _signalPower = 100.0;
      _nexusStatus = 'Interstellaarinen pulssi lähetetty syvään avaruuteen onnistuneesti!';
      _interstellarBeacons.insert(0, {
        'beacon': 'Orion-Nebula-Node',
        'distance': '1,344 lly',
        'status': 'Uusi yhteys'
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
              '✨ Spacemonkey Astral Nexus & Interstellar Beacon',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Signaali: ${_signalPower.toStringAsFixed(1)}%',
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
            _nexusStatus,
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
              itemCount: _interstellarBeacons.length,
              itemBuilder: (context, index) {
                final beacon = _interstellarBeacons[index];
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
                          Text(beacon['beacon']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Etäisyys: ${beacon['distance']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        beacon['status']!,
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
              onPressed: _broadcastInterstellarPulse,
              child: const Text('Lähetä interstellaarinen pulssi'),
            ),
            ToggleSwitch(
              checked: _astralBeaconActive,
              content: const Text('Astral Majakka', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _astralBeaconActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
