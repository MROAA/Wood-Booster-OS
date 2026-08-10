import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96MagnifierModule extends StatefulWidget {
  const Win96MagnifierModule({super.key});

  @override
  State<Win96MagnifierModule> createState() => _Win96MagnifierModuleState();
}

class _Win96MagnifierModuleState extends State<Win96MagnifierModule> {
  double _zoomLevel = 2.0;
  bool _invertColors = false;

  void _setZoom(double zoom) {
    setState(() {
      _zoomLevel = zoom;
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
              '🔍 Win96 Accessibility Magnifier (magnify.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Zoom: ${_zoomLevel.toStringAsFixed(1)}x',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _invertColors ? Colors.white : Colors.black,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  FluentIcons.zoom_in,
                  size: 48,
                  color: _invertColors ? Colors.black : Colors.blue,
                ),
                const SizedBox(height: 16),
                Text(
                  'Suurennustaso: ${_zoomLevel.toStringAsFixed(1)}x aktiivinen',
                  style: TextStyle(
                    color: _invertColors ? Colors.black : Colors.blue.withOpacity(0.9),
                    fontSize: 13,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Seuraa hiiren kursoria ja zoomaa kohdealuetta.',
                  style: TextStyle(
                    color: _invertColors ? Colors.black54 : Colors.white.withOpacity(0.6),
                    fontSize: 11,
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
            Button(onPressed: () => _setZoom(2.0), child: const Text('2x Zoom')),
            Button(onPressed: () => _setZoom(4.0), child: const Text('4x Zoom')),
            Button(onPressed: () => _setZoom(8.0), child: const Text('8x Zoom (Max)')),
            ToggleSwitch(
              checked: _invertColors,
              content: const Text('Inverttivärit', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _invertColors = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
