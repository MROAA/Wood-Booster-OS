import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentMasterHubModule extends StatefulWidget {
  const DigitalEnvironmentMasterHubModule({super.key});

  @override
  State<DigitalEnvironmentMasterHubModule> createState() => _DigitalEnvironmentMasterHubModuleState();
}

class _DigitalEnvironmentMasterHubModuleState extends State<DigitalEnvironmentMasterHubModule> {
  bool _hubActive = true;
  double _hubResonance = 100.0;
  String _hubStatus = 'Master Hub aktiivinen: Kaikki 445+ moduulia täydellisessä synkronissa.';
  
  final List<Map<String, String>> _registeredClusters = [
    {'cluster': 'Zenith-Apex & Horizon', 'modules': '95', 'status': 'Resonoi'},
    {'cluster': 'Omega & Absolute Cores', 'modules': '110', 'status': 'Aktivoitu'},
    {'cluster': 'Genesis & Prime Matrices', 'modules': '120', 'status': 'Sykkii'},
    {'cluster': 'Transcendental & Singularity', 'modules': '120+', 'status': 'Transkendoi'},
  ];

  void _syncAllClusters() {
    setState(() {
      _hubResonance = 100.0;
      _hubStatus = 'Master Hub synkronointi suoritettu: Kaikki klusterit toimivat nollaviiveellä.';
      _registeredClusters.insert(0, {
        'cluster': 'Omniversal Constitution Hub',
        'modules': '1',
        'status': 'Valvoo'
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
              '🌐 Spacemonkey Master Registry & Hub',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Synkka: ${_hubResonance.toStringAsFixed(0)}%',
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
            _hubStatus,
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
              itemCount: _registeredClusters.length,
              itemBuilder: (context, index) {
                final cluster = _registeredClusters[index];
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
                          Text(cluster['cluster']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Moduuleja: ${cluster['modules']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        cluster['status']!,
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
              onPressed: _syncAllClusters,
              child: const Text('Synkronoi Kaikki Klusterit'),
            ),
            ToggleSwitch(
              checked: _hubActive,
              content: const Text('Master Hub -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _hubActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
