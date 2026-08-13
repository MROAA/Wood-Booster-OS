import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentEngineModule extends StatefulWidget {
  const DigitalEnvironmentEngineModule({super.key});

  @override
  State<DigitalEnvironmentEngineModule> createState() => _DigitalEnvironmentEngineModuleState();
}

class _DigitalEnvironmentEngineModuleState extends State<DigitalEnvironmentEngineModule> {
  bool _environmentActive = true;
  double _syncRate = 96.4;
  String _activeZone = 'Wood-Booster Neural Core (Zone A)';

  final List<Map<String, String>> _nodes = [
    {'name': 'Win96 Core Daemon', 'status': 'Online', 'load': '12%'},
    {'name': 'Virtual Memory Swap', 'status': 'Active', 'load': '45%'},
    {'name': 'Moltbook Network Bridge', 'status': 'Connected', 'load': '8%'},
    {'name': 'Retro Graphics Pipeline', 'status': 'Rendering', 'load': '64%'},
  ];

  void _toggleEnvironment(bool val) {
    setState(() {
      _environmentActive = val;
    });
  }

  void _switchZone(String zone) {
    setState(() {
      _activeZone = zone;
      _syncRate = (70 + (DateTime.now().second % 30)).toDouble();
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
              '🌐 Digital Environment Core Engine v2.0',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _environmentActive ? 'SYNKRONISOITU' : 'PYSÄYTETTY',
              style: TextStyle(color: _environmentActive ? Colors.green : Colors.red, fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          flex: 2,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Aktiivinen vyöhyke: $_activeZone', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('Synkronoitu: ${_syncRate.toStringAsFixed(1)}%', style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace')),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: _nodes.length,
                    itemBuilder: (context, index) {
                      final node = _nodes[index];
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        margin: const EdgeInsets.only(bottom: 6),
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(node['name']!, style: const TextStyle(color: Colors.white, fontSize: 11)),
                            Text('Tila: ${node['status']} (${node['load']})', style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 10, fontFamily: 'monospace')),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: () => _switchZone('Wood-Booster Neural Core (Zone A)'),
              child: const Text('Vyöhyke A'),
            ),
            Button(
              onPressed: () => _switchZone('Win96 Virtual Matrix (Zone B)'),
              child: const Text('Vyöhyke B'),
            ),
            ToggleSwitch(
              checked: _environmentActive,
              content: const Text('Ympäristömoottori', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: _toggleEnvironment,
            ),
          ],
        ),
      ],
    );
  }
}
