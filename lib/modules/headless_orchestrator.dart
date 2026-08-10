import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessOrchestratorModule extends StatefulWidget {
  const HeadlessOrchestratorModule({super.key});

  @override
  State<HeadlessOrchestratorModule> createState() => _HeadlessOrchestratorModuleState();
}

class _HeadlessOrchestratorModuleState extends State<HeadlessOrchestratorModule> {
  bool _orchestratorActive = true;
  String _orchestratorStatus = 'Orkestrointimoottori tasapainottaa kuormaa (4 solmua aktiivisena).';
  final List<Map<String, String>> _nodes = [
    {'node': 'Worker-Node-01', 'load': '22%', 'status': 'Optimoitu'},
    {'node': 'Worker-Node-02', 'load': '45%', 'status': 'Aktiviinen'},
    {'node': 'Worker-Node-03', 'load': '12%', 'status': 'Valmiudessa'},
    {'node': 'Worker-Node-04', 'load': '68%', 'status': 'Kuormitettu'},
  ];

  void _rebalanceCluster() {
    setState(() {
      _orchestratorStatus = 'Klusteri tasapainotettu uudelleen: Tehtävät jaettu tasaisesti solmuille.';
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
              '⚙️ Headless Multi-Agent Orchestrator',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _orchestratorActive ? 'ORKESTROIDAAN' : 'PYSÄYTETTY',
              style: TextStyle(color: _orchestratorActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _orchestratorStatus,
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
              itemCount: _nodes.length,
              itemBuilder: (context, index) {
                final node = _nodes[index];
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
                          Text('Kuorma: ${node['load']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
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
              onPressed: _rebalanceCluster,
              child: const Text('Tasapainota klusteri (Rebalance)'),
            ),
            ToggleSwitch(
              checked: _orchestratorActive,
              content: const Text('Orkestrointi aktiivinen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _orchestratorActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
