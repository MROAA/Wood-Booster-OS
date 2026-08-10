import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentMeshModule extends StatefulWidget {
  const DigitalEnvironmentMeshModule({super.key});

  @override
  State<DigitalEnvironmentMeshModule> createState() => _DigitalEnvironmentMeshModuleState();
}

class _DigitalEnvironmentMeshModuleState extends State<DigitalEnvironmentMeshModule> {
  bool _meshActive = true;
  String _meshStatus = 'Mesh-verkkosolmu aktiivinen. Yhteys 5 etäsolmuun muodostettu.';
  
  final List<Map<String, String>> _meshPeers = [
    {'node': 'Win96-Core-Alpha', 'latency': '12ms', 'status': 'Synkronoitu'},
    {'node': 'Spacemonkey-Orbiter-01', 'latency': '28ms', 'status': 'Välittää dataa'},
    {'node': 'Headless-Daemon-Node', 'latency': '4ms', 'status': 'Pääsolmu'},
  ];

  void _syncMeshNetwork() {
    setState(() {
      _meshStatus = 'Suoritettu Mesh-verkon laajuinen konsensus: Kaikki solmut päivitetty.';
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
              '🛰️ Spacemonkey Galactic Mesh Network',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _meshActive ? 'MESH PÄÄLLÄ' : 'OFFLINE',
              style: TextStyle(color: _meshActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _meshStatus,
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
              itemCount: _meshPeers.length,
              itemBuilder: (context, index) {
                final peer = _meshPeers[index];
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
                          Text(peer['node']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Latenssi: ${peer['latency']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        peer['status']!,
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
              onPressed: _syncMeshNetwork,
              child: const Text('Synkronoi Mesh-solmut'),
            ),
            ToggleSwitch(
              checked: _meshActive,
              content: const Text('Mesh-verkkotila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _meshActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
