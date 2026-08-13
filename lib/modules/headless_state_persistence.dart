import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessStatePersistenceModule extends StatefulWidget {
  const HeadlessStatePersistenceModule({super.key});

  @override
  State<HeadlessStatePersistenceModule> createState() => _HeadlessStatePersistenceModuleState();
}

class _HeadlessStatePersistenceModuleState extends State<HeadlessStatePersistenceModule> {
  bool _autoSync = true;
  String _persistenceStatus = 'Tila tallennettu onnistuneesti: /var/lib/win96/headless_state.json';
  final List<Map<String, String>> _savedStates = [
    {'target': 'VectorMemory_Store', 'size': '4.2 KB', 'timestamp': '12:00:10'},
    {'target': 'AgentSwarm_Registry', 'size': '1.8 KB', 'timestamp': '12:05:22'},
    {'target': 'DaemonConfig_Settings', 'size': '0.9 KB', 'timestamp': '12:10:05'},
  ];

  void _saveStateNow() {
    setState(() {
      _persistenceStatus = 'Manuaalinen tilavedos (Snapshot) luotu ja kirjoitettu levylle.';
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
              '💾 Headless State Persistence & Storage',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _autoSync ? 'SYNKKÄ PÄÄLLÄ' : 'MANUAALINEN',
              style: TextStyle(color: _autoSync ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _persistenceStatus,
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
              itemCount: _savedStates.length,
              itemBuilder: (context, index) {
                final state = _savedStates[index];
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
                          Text(state['target']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Koko: ${state['size']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        state['timestamp']!,
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
              onPressed: _saveStateNow,
              child: const Text('Tallenna tila nyt (Snapshot)'),
            ),
            ToggleSwitch(
              checked: _autoSync,
              content: const Text('Automaattinen tallennus', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _autoSync = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
