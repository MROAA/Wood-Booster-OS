import math

class Windows11Calculator:
    """Simuloi Windows 11 Laskin (Calculator) -sovellusta."""
    def __init__(self):
        self.history = []
        self.mode = "Standard"

    def calculate(self, operation: str, a: float, b: float = 0.0):
        result = 0.0
        op_str = ""
        
        if operation == "add":
            result = a + b
            op_str = f"{a} + {b} = {result}"
        elif operation == "subtract":
            result = a - b
            op_str = f"{a} - {b} = {result}"
        elif operation == "multiply":
            result = a * b
            op_str = f"{a} * {b} = {result}"
        elif operation == "divide":
            if b == 0:
                return {"success": False, "error": "Nollalla jakaminen kielletty."}
            result = a / b
            op_str = f"{a} / {b} = {result}"
        elif operation == "sqrt":
            if a < 0:
                return {"success": False, "error": "Negatiivisen luvun neliöjuuri ei ole reaaliluku."}
            result = math.sqrt(a)
            op_str = f"sqrt({a}) = {result}"
        else:
            return {"success": False, "error": f"Tuntematon operaatio: {operation}"}

        self.history.insert(0, op_str)
        if len(self.history) > 10:
            self.history.pop()

        return {
            "success": True,
            "operation": operation,
            "result": result,
            "expression": op_str,
            "history": self.history
        }

    def get_calculator_overview(self):
        return {
            "component": "Windows 11 Calculator Application",
            "mode": self.mode,
            "recent_history": self.history
        }
