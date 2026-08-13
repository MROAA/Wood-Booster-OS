import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentSpatial3dModule extends StatefulWidget {
  const DigitalEnvironmentSpatial3dModule({super.key});

  @override
  State<DigitalEnvironmentSpatial3dModule> createState() => _DigitalEnvironmentSpatial3dModuleState();
}

class _DigitalEnvironmentSpatial3dModuleState extends State<DigitalEnvironmentSpatial3dModule> {
  double _coordX = 12.4;
  double _coordY = 45.8;
  double _coordZ = 9.2;
  String _spatialStatus = 'Spatiaalinen 3D-grid aktiivinen. Spacemonkey sijoitettu solmupisteeseen.';

  final List<Map<String, String>> _spatialNodes = [
    {'id': 'Node-A1', 'pos': '(X: 10.0, Y: 20.0, Z: 5.0)', 'type': 'RAG Memory Core'},
    {'id': 'Node-B2', 'pos': '(X: 45.2, Y: 12.1, Z: 8.9)', 'type': 'Audio Spatial Node'},
    {'id': 'Node-C3', 'pos': '(X: 88.7, Y: 90.4, Z: 15.0)', 'type': 'Headless Sandbox Zone'},
  ];

  void _moveSpacemonkey() {
    setState(() {
      _coordX += 2.5;
      _coordY -= 1.8;
      _spatialStatus = 'Spacemonkey siirretty uusiin koordinaatteihin: (${_coordX.toStringAsFixed(1)}, ${_coordY.toStringAsFixed(1)}, ${_coordZ.toStringAsFixed(1)})';
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
              '🌌 Spacemonkey Virtual 3D Spatial Grid',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Pos: (${_coordX.toStringAsFixed(1)}, ${_coordY.toStringAsFixed(1)})',
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
            _spatialStatus,
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
              itemCount: _spatialNodes.length,
              itemBuilder: (context, index) {
                final node = _spatialNodes[index];
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
                          Text(node['id']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Tyyppi: ${node['type']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        node['pos']!,
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
        Button(
          onPressed: _moveSpacemonkey,
          child: const Text('Navigoi Spacemonkey 3D-tilassa'),
        ),
      ],
    );
  }
}
