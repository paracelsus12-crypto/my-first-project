// playground.js - Интеграция с Pyodide и выполнение Python кода

const PythonRunner = {
  pyodide: null,
  isReady: false,
  onReadyCallbacks: [],

  // Инициализация Pyodide
  async init() {
    console.log("Начало загрузки Pyodide...");
    const loaderEl = document.getElementById("pyodide-loader");
    
    try {
      // Загружаем Pyodide
      this.pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
      });
      
      this.isReady = true;
      console.log("Pyodide успешно загружен!");
      
      // Скрываем загрузчик с плавной анимацией
      if (loaderEl) {
        loaderEl.style.opacity = "0";
        setTimeout(() => {
          loaderEl.style.display = "none";
        }, 500);
      }
      
      // Показываем уведомление
      if (typeof showToast === 'function') {
        showToast("Python успешно запущен в браузере! 🐍", "success");
      }

      // Вызываем сохраненные коллбэки
      this.onReadyCallbacks.forEach(cb => cb());
      this.onReadyCallbacks = [];
    } catch (error) {
      console.error("Ошибка при инициализации Pyodide:", error);
      if (loaderEl) {
        loaderEl.innerHTML = `
          <div style="color: var(--error); font-weight: 700;">❌ Ошибка запуска интерпретатора!</div>
          <div style="font-size: 11px; margin-top: 4px; max-width: 300px;">Проверьте подключение к интернету и обновите страницу.</div>
        `;
      }
    }
  },

  // Регистрация коллбэка на готовность
  onReady(callback) {
    if (this.isReady) {
      callback();
    } else {
      this.onReadyCallbacks.push(callback);
    }
  },

  // Запуск Python кода
  async runCode(code, options = {}) {
    if (!this.isReady) {
      return {
        success: false,
        error: "Интерпретатор Python еще загружается. Пожалуйста, подождите..."
      };
    }

    const {
      onStdout = () => {},
      onStderr = () => {},
      validationType = "none",
      validationCode = "",
      expectedOutput = ""
    } = options;

    let stdoutBuffer = [];
    let stderrBuffer = [];

    // Перенаправляем stdout и stderr в Pyodide
    this.pyodide.setStdout({
      batched: (str) => {
        stdoutBuffer.push(str);
        onStdout(str);
      }
    });

    this.pyodide.setStderr({
      batched: (str) => {
        stderrBuffer.push(str);
        onStderr(str);
      }
    });

    try {
      // Очищаем локальное пространство имен от предыдущих запусков
      // (чтобы переменные предыдущих запусков не мешали валидации)
      // Мы можем запустить код в чистом словаре
      
      // Запускаем основной код пользователя
      await this.pyodide.runPythonAsync(code);
      
      const fullStdout = stdoutBuffer.join("\n").trim();
      
      // Производим валидацию
      let passed = false;
      let valErrorMsg = "";

      if (validationType === "stdout") {
        // Проверяем точное соответствие вывода (игнорируя пробелы по краям)
        const expected = expectedOutput.trim().replace(/\r\n/g, "\n");
        const actual = fullStdout.replace(/\r\n/g, "\n");
        
        if (actual === expected) {
          passed = true;
        } else {
          valErrorMsg = `Ожидался вывод:\n"${expected}"\n\nПолучено:\n"${actual}"`;
        }
      } else if (validationType === "eval" && validationCode) {
        // Запускаем дополнительный валидационный скрипт Python
        try {
          await this.pyodide.runPythonAsync(validationCode);
          passed = true;
        } catch (valErr) {
          passed = false;
          // Извлекаем понятное сообщение об ошибке (например, из AssertionError)
          const errLines = valErr.message.split("\n");
          valErrorMsg = errLines[errLines.length - 2] || valErr.message;
          if (valErrorMsg.includes("AssertionError:")) {
            valErrorMsg = valErrorMsg.replace("AssertionError:", "Ошибка валидации:").trim();
          }
        }
      } else {
        // Если проверка не требуется, код выполнился без исключений -> успех
        passed = true;
      }

      return {
        success: passed,
        stdout: fullStdout,
        error: valErrorMsg
      };

    } catch (error) {
      // Ошибки компиляции или выполнения
      console.warn("Ошибка выполнения Python:", error);
      
      let formattedError = error.message;
      
      // Извлекаем только имя ошибки и сообщение для читаемости учеником
      const lines = formattedError.split("\n");
      let readableError = lines.slice(-4).join("\n").trim(); // Берем traceback в конце
      
      if (!readableError) {
        readableError = formattedError;
      }

      onStderr(readableError);
      
      return {
        success: false,
        stdout: stdoutBuffer.join("\n").trim(),
        error: readableError
      };
    }
  }
};

// Запуск инициализации при загрузке скрипта
window.addEventListener("DOMContentLoaded", () => {
  PythonRunner.init();
});

// Шаблоны кода для Песочницы
const playgroundTemplates = [
  {
    id: "fibonacci",
    title: "Числа Фибоначчи 🐇",
    desc: "Генератор последовательности чисел Фибоначчи с использованием цикла.",
    code: `# Генератор чисел Фибоначчи
def fibonacci(n):
    sequence = [0, 1]
    while len(sequence) < n:
        next_num = sequence[-1] + sequence[-2]
        sequence.append(next_num)
    return sequence[:n]

# Выводим первые 10 чисел
count = 10
result = fibonacci(count)
print(f"Первые {count} чисел Фибоначчи:")
print(result)
`
  },
  {
    id: "bubble-sort",
    title: "Пузырьковая сортировка 🫧",
    desc: "Простой алгоритм сортировки списка чисел с пошаговой визуализацией.",
    code: `# Сортировка пузырьком
def bubble_sort(arr):
    n = len(arr)
    print(f"Исходный список: {arr}\\n")
    
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j+1]:
                # Меняем элементы местами
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
                print(f"  Меняем местами {arr[j+1]} и {arr[j]} -> {arr}")
        
        # Если за проход не было обменов, список отсортирован
        if not swapped:
            break
            
    print(f"\\nОтсортированный список: {arr}")

numbers = [64, 34, 25, 12, 22, 11, 90]
bubble_sort(numbers)
`
  },
  {
    id: "prime-checker",
    title: "Проверка простых чисел 🔢",
    desc: "Функция для определения, является ли число простым.",
    code: `# Проверка, является ли число простым
def is_prime(number):
    if number <= 1:
        return False
    
    # Ищем делители от 2 до квадратного корня из числа
    for i in range(2, int(number ** 0.5) + 1):
        if number % i == 0:
            return False
            
    return True

# Тестируем функцию на диапазоне чисел
for num in range(1, 20):
    if is_prime(num):
        print(f"Число {num:2} — ПРОСТОЕ ⭐")
    else:
        print(f"Число {num:2} — составное")
`
  },
  {
    id: "oop-demo",
    title: "Введение в ООП 🏛️",
    desc: "Создание классов, атрибутов и методов объектов в Python.",
    code: `# Описание класса Персона
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        
    def greet(self):
        return f"Привет! Меня зовут {self.name}, и мне {self.age} лет."

# Наследование класса Студент от Персоны
class Student(Person):
    def __init__(self, name, age, course):
        # Вызываем конструктор родителя
        super().__init__(name, age)
        self.course = course
        
    def greet(self):
        parent_greeting = super().greet()
        return f"{parent_greeting} Я учусь на курсе: {self.course}."

# Создаем объекты
persona = Person("Иван", 30)
student = Student("Мария", 20, "Разработчик Python")

print(persona.greet())
print(student.greet())
`
  }
];

// Данные для шпаргалки
const cheatsheetData = [
  {
    category: "Основы",
    title: "Вывод данных print()",
    desc: "Выводит переданные аргументы на экран в консоль. По умолчанию разделяет пробелом и завершает переносом строки.",
    code: `print("Привет, мир!")
print("Имя:", "Алексей", "Возраст:", 25) # разделение пробелом
print("Раз", "Два", sep=" - ")           # кастомный разделитель
print("Без переноса строки", end="")     # без переноса в конце`
  },
  {
    category: "Основы",
    title: "Ввод данных input()",
    desc: "Считывает строку текста, введенную пользователем с клавиатуры. Всегда возвращает тип str.",
    code: `name = input("Введите имя: ")
print("Привет, " + name)

# Для считывания чисел используйте приведение типов
age = int(input("Введите возраст: "))
height = float(input("Введите рост (м): "))`
  },
  {
    category: "Типы данных",
    title: "Базовые типы",
    desc: "Python имеет встроенную динамическую типизацию. Тип переменной определяется автоматически при присваивании.",
    code: `integer_num = 10         # int (целое число)
float_num = 3.14          # float (вещественное число)
text_string = "Python"    # str (строка)
is_active = True          # bool (логический: True / False)
nothing = None            # NoneType (пустое значение)`
  },
  {
    category: "Условия",
    title: "Конструкция if-elif-else",
    desc: "Используется для ветвления логики программы. Блоки кода определяются отступами в 4 пробела.",
    code: `x = 10
if x > 15:
    print("x больше 15")
elif x == 10:
    print("x равен 10")
else:
    print("x меньше 10")`
  },
  {
    category: "Циклы",
    title: "Цикл while",
    desc: "Выполняет блок кода до тех пор, пока условие истинно (равно True).",
    code: `n = 0
while n < 5:
    print(n)
    n += 1 # увеличиваем счетчик`
  },
  {
    category: "Циклы",
    title: "Цикл for и range()",
    desc: "Используется для перебора последовательности элементов или итерации в диапазоне чисел.",
    code: `# От 0 до 4 (не включая 5)
for i in range(5):
    print(i)

# От 1 до 10 с шагом 2 (1, 3, 5, 7, 9)
for x in range(1, 10, 2):
    print(x)

# Перебор символов в строке
for letter in "Python":
    print(letter)`
  },
  {
    category: "Списки",
    title: "Методы списков",
    desc: "Список (list) — это упорядоченная изменяемая коллекция элементов любого типа.",
    code: `my_list = [10, 20, 30]

my_list.append(40)     # добавляет 40 в конец -> [10, 20, 30, 40]
my_list.insert(1, 15)  # вставляет 15 на индекс 1 -> [10, 15, 20, 30, 40]
my_list.remove(20)     # удаляет первое вхождение 20 -> [10, 15, 30, 40]
last = my_list.pop()   # удаляет и возвращает последний -> 40
length = len(my_list)  # длина списка -> 3`
  },
  {
    category: "Словари",
    title: "Работа со словарями (dict)",
    desc: "Словарь хранит пары уникальных ключей и их значений в формате key: value.",
    code: `user = {"name": "Игорь", "age": 28}

# Чтение значения
print(user["name"]) # Игорь

# Безопасное чтение (без падения, если ключа нет)
city = user.get("city", "Не указан")

# Изменение и добавление
user["age"] = 29
user["email"] = "igor@example.com"

# Удаление
del user["email"]`
  },
  {
    category: "Функции",
    title: "Объявление функций def",
    desc: "Функция — это многократно используемый блок кода. Объявляется с помощью def и возвращает значение с помощью return.",
    code: `def calculate_area(width, height):
    area = width * height
    return area

# Вызов функции
result = calculate_area(5, 8)
print("Площадь:", result) # Площадь: 40`
  }
];
