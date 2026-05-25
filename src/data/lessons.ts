import { Module, CodeTemplate, CheatSheetItem } from "../types";

export const pythonLessonsData: Module[] = [
  {
    id: "module-1",
    title: "1. Основы Python",
    summary: "Познакомьтесь с синтаксисом Python, переменными, базовыми типами данных и арифметикой.",
    xpReward: 100,
    lessons: [
      {
        id: "m1-l1",
        title: "Первая строка кода",
        theory: `
          <h3>Добро пожаловать в мир Python! 🐍</h3>
          <p>Python — один из самых популярных и простых в изучении языков программирования. Он используется везде: в веб-разработке, анализе данных, искусственном интеллекте и автоматизации.</p>
          
          <p>Самый простой способ заставить компьютер общаться с вами — использовать функцию <code>print()</code>. Она выводит на экран текст, который вы передадите ей внутри круглых скобок в кавычках.</p>
          
          <div class="theory-note my-4 p-3 bg-blue-950/40 border-l-4 border-blue-500 rounded-r-lg text-sm text-slate-100">
            <strong>Пример:</strong><br>
            <code>print("Привет, разработчик!")</code>
          </div>
          
          <p>В кавычках (одинарных или двойных) в Python записываются текстовые строки (str).</p>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Напишите программу, которая выводит на экран текст: <code>Привет, PyLearn!</code></p>
        `,
        starterCode: `# Напишите ваш код ниже этой строки\nprint("Измени меня")\n`,
        validationType: "stdout",
        expectedOutput: "Привет, PyLearn!",
        hint: "Убедитесь, что вы написали именно 'Привет, PyLearn!' с точностью до регистра букв и знаков препинания.",
        quiz: {
          question: "Для чего используется функция print() в Python?",
          options: [
            "Для печати текста на принтере",
            "Для вывода информации на экран в консоль",
            "Для создания новых переменных",
            "Для импорта сторонних библиотек"
          ],
          correctIdx: 1,
          explanation: "Функция print() выводит переданный ей текст или значения переменных на экран в стандартный вывод (консоль)."
        }
      },
      {
        id: "m1-l2",
        title: "Переменные и их создание",
        theory: `
          <h3>Переменные — это коробки для данных 📦</h3>
          <p>Переменная позволяет сохранять информацию, чтобы использовать её позже. Представьте переменную как коробку с наклейкой-именем, внутри которой лежит какое-то значение.</p>
          
          <p>Создать переменную в Python очень просто: пишем её имя, ставим знак <code>=</code> (оператор присваивания) и значение.</p>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code># Создаем переменную с именем age и значением 25
age = 25

# Создаем текстовую переменную name
name = "Алексей"</code></pre>

          <p>Имена переменных в Python должны начинаться с буквы или знака подчеркивания <code>_</code> и могут содержать цифры. Python чувствителен к регистру (<code>age</code> и <code>Age</code> — разные переменные).</p>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Создайте переменную с именем <code>course_name</code> и присвойте ей значение <code>"Python с нуля"</code>. Затем выведите её значение на экран с помощью <code>print(course_name)</code>.</p>
        `,
        starterCode: `# Создайте переменную course_name со значением "Python с нуля"\n\n# Выведите переменную course_name на экран\n`,
        validationType: "eval",
        validationCode: `
# Проверка наличия переменной в пространстве имен
if 'course_name' not in globals():
    raise AssertionError("Вы не создали переменную 'course_name'")
if course_name != "Python с нуля":
    raise AssertionError("Переменная course_name должна быть равна 'Python с нуля'")
`,
        expectedOutput: "Python с нуля",
        hint: "Не забудьте использовать кавычки вокруг текста 'Python с нуля' при присваивании переменной.",
        quiz: {
          question: "Какое имя переменной является НЕДОПУСТИМЫМ в Python?",
          options: [
            "user_age",
            "_secret_key",
            "3d_model",
            "activeElement"
          ],
          correctIdx: 2,
          explanation: "Имена переменных в Python не могут начинаться с цифры. Вариант '3d_model' вызовет синтаксическую ошибку SyntaxError."
        }
      },
      {
        id: "m1-l3",
        title: "Математические операции",
        theory: `
          <h3>Python как супер-калькулятор 🧮</h3>
          <p>Python поддерживает все стандартные математические операции:</p>
          <ul class="list-disc list-inside space-y-1 my-3">
            <li><code>+</code> (сложение)</li>
            <li><code>-</code> (вычитание)</li>
            <li><code>*</code> (умножение)</li>
            <li><code>/</code> (деление, всегда возвращает дробное число)</li>
            <li><code>//</code> (целочисленное деление, отбрасывает дробную часть)</li>
            <li><code>%</code> (остаток от деления)</li>
            <li><code>**</code> (возведение в степень)</li>
          </ul>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code>a = 10
b = 3
print(a / b)   # Выведет: 3.3333333333333335
print(a // b)  # Выведет: 3
print(a % b)   # Выведет: 1 (остаток от деления)
print(a ** b)  # Выведет: 1000 (10 в третьей степени)</code></pre>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>У вас есть две переменные <code>x = 12</code> and <code>y = 5</code>. Вычислите остаток от деления <code>x</code> на <code>y</code>, сохраните результат в переменную <code>remainder</code> и выведите её на экран.</p>
        `,
        starterCode: `x = 12\ny = 5\n\n# Вычислите остаток от деления x на y и запишите в remainder\nremainder = \n\n# Выведите remainder на экран\n`,
        validationType: "eval",
        validationCode: `
if 'remainder' not in globals():
    raise AssertionError("Переменная 'remainder' не создана")
if remainder != 2:
    raise AssertionError(f"Неверный результат. Ожидалось 2, получено {remainder}")
`,
        expectedOutput: "2",
        hint: "Используйте оператор остатка от деления %, например: remainder = x % y",
        quiz: {
          question: "Чему будет равен результат операции 11 // 3 в Python?",
          options: [
            "3.66666666666",
            "3",
            "2",
            "4"
          ],
          correctIdx: 1,
          explanation: "Оператор // выполняет целочисленное деление. 11 делится на 3 с остатком 2. Целая часть равна 3."
        }
      }
    ]
  },
  {
    id: "module-2",
    title: "2. Условия и Циклы",
    summary: "Научите программу принимать решения с помощью условий if-else и повторять действия с циклами for и while.",
    xpReward: 150,
    lessons: [
      {
        id: "m2-l1",
        title: "Условный оператор (if-elif-else)",
        theory: `
          <h3>Принятие решений 🚦</h3>
          <p>Программы становятся по-настоящему полезными, когда они умеют вести себя по-разному в зависимости от условий. В Python для этого используется конструкция <code>if-elif-else</code>.</p>
          
          <p>Важнейшая особенность Python — <strong>отступы</strong>. Весь код, который должен выполниться при соблюдении условия, должен иметь отступ в 4 пробела (или 1 Tab).</p>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code>temperature = 22

if temperature > 25:
    print("Жарко")
elif temperature >= 18:
    print("Приятная погода")
else:
    print("Холодно")</code></pre>
          
          <p>В Python используются операторы сравнения: <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, <code>==</code> (равно) и <code>!=</code> (не равно).</p>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Дана переменная <code>score = 75</code>. Напишите условие:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Если <code>score</code> больше или равен 60, выведите на экран <code>"Зачет"</code></li>
            <li>Иначе выведите <code>"Незачет"</code></li>
          </ul>
        `,
        starterCode: `score = 75\n\n# Напишите ваше условие if-else ниже\n`,
        validationType: "eval",
        validationCode: `
# Тест корректности вывода
`,
        expectedOutput: "Зачет",
        hint: "Не забывайте ставить двоеточие ':' после if и else, а также делать отступы на следующей строке!",
        quiz: {
          question: "Какой оператор используется для проверки на равенство в Python?",
          options: [
            "=",
            "==",
            "equals",
            "==="
          ],
          correctIdx: 1,
          explanation: "Одинарный знак '=' — это оператор присваивания. Для сравнения двух значений на равенство используется двойной знак '=='."
        }
      },
      {
        id: "m2-l2",
        title: "Цикл while",
        theory: `
          <h3>Циклы: Повторяем задачи 🔄</h3>
          <p>Циклы позволяют выполнять блок кода многократно, пока выполняется определенное условие.</p>
          
          <p>Цикл <code>while</code> (пока) работает до тех пор, пока его условие истинно (<code>True</code>).</p>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code>count = 1
while count <= 3:
    print("Привет", count)
    count = count + 1 # увеличиваем счетчик</code></pre>
          
          <p>Если условие никогда не станет ложным, возникнет <em>бесконечный цикл</em>, и программа зависнет.</p>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Напишите цикл <code>while</code>, который выводит числа от <code>1</code> до <code>5</code> включительно, каждое на новой строке.</p>
        `,
        starterCode: `# Создайте переменную-счетчик\nn = 1\n\n# Напишите цикл while\n`,
        validationType: "stdout",
        expectedOutput: "1\n2\n3\n4\n5",
        hint: "Внутри цикла выводите print(n) и обязательно увеличивайте n на 1 на каждом шаге: n += 1 или n = n + 1",
        quiz: {
          question: "Что произойдет, если в цикле while условие всегда будет True, а внутри нет выхода из цикла?",
          options: [
            "Программа выдаст ошибку SyntaxError и не запустится",
            "Цикл выполнится ровно 100 раз и остановится",
            "Программа войдет в бесконечный цикл и может зависнуть",
            "Python автоматически добавит счетчик и остановит программу"
          ],
          correctIdx: 2,
          explanation: "Без изменения переменных условия или ключевого слова break, цикл с условием True будет выполняться вечно (бесконечный цикл)."
        }
      },
      {
        id: "m2-l3",
        title: "Цикл for и range()",
        theory: `
          <h3>Перебор элементов с циклом for 🚶‍♂️</h3>
          <p>Цикл <code>for</code> в Python используется для итерации (перебора) по последовательностям (например, строкам, спискам) или диапазонам чисел.</p>
          
          <p>Чтобы сгенерировать последовательность чисел, используется функция <code>range()</code>. Например, <code>range(5)</code> создает числа от 0 до 4 (5 чисел, не включая верхнюю границу).</p>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code># Выведет числа от 0 до 4
for i in range(5):
    print(i)

# range(старт, стоп): выведет от 2 до 5 (не включая 6)
for i in range(2, 6):
    print(i)</code></pre>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Используя цикл <code>for</code> и функцию <code>range()</code>, выведите на экран квадраты чисел от <code>1</code> до <code>4</code> включительно (то есть: 1, 4, 9, 16). Каждое число на новой строке.</p>
        `,
        starterCode: `# Напишите цикл for с range() для возведения чисел от 1 до 4 в квадрат\n`,
        validationType: "stdout",
        expectedOutput: "1\n4\n9\n16",
        hint: "Помните, что range(1, 5) сгенерирует числа 1, 2, 3, 4. Для возведения числа в квадрат используйте оператор ** 2.",
        quiz: {
          question: "Какие числа сгенерирует вызов range(2, 8, 2) (где третий параметр — шаг)?",
          options: [
            "2, 3, 4, 5, 6, 7, 8",
            "2, 4, 6",
            "2, 4, 6, 8",
            "2, 5, 8"
          ],
          correctIdx: 1,
          explanation: "range(start, stop, step) начинает с 2, идет с шагом 2 и останавливается до 8. Числа: 2, 4, 6 (8 не включается)."
        }
      }
    ]
  },
  {
    id: "module-3",
    title: "3. Списки и Словари",
    summary: "Изучите основные структуры данных в Python: упорядоченные списки (lists) и пары ключ-значение в словарях (dicts).",
    xpReward: 200,
    lessons: [
      {
        id: "m3-l1",
        title: "Списки (List)",
        theory: `
          <h3>Списки: Храним коллекции данных 📚</h3>
          <p>Список в Python (list) — это упорядоченная коллекция элементов, которая может содержать разные типы данных. Списки создаются с помощью квадратных скобок <code>[]</code>.</p>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code>fruits = ["яблоко", "банан", "апельсин"]
print(fruits[0]) # Выведет первый элемент: яблоко (индексация начинается с 0)
print(len(fruits)) # Выведет длину списка: 3</code></pre>
          
          <p>Основные методы списков:</p>
          <ul class="list-disc list-inside space-y-1">
            <li><code>.append(element)</code> — добавляет элемент в конец списка.</li>
            <li><code>.remove(element)</code> — удаляет указанный элемент.</li>
            <li><code>.pop(index)</code> — удаляет и возвращает элемент по индексу.</li>
          </ul>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Создайте пустой список с именем <code>shopping_list</code>. С помощью метода <code>.append()</code> добавьте в него по очереди три строки: <code>"молоко"</code>, <code>"хлеб"</code>, <code>"яблоки"</code>. Выведите список на экран.</p>
        `,
        starterCode: `# Создайте пустой список shopping_list\nshopping_list = \n\n# Добавьте элементы с помощью .append()\n\n# Выведите shopping_list на экран\n`,
        validationType: "eval",
        validationCode: `
if 'shopping_list' not in globals():
    raise AssertionError("Список 'shopping_list' не создан")
if shopping_list != ["молоко", "хлеб", "яблоки"]:
    raise AssertionError(f"Список некорректен. Ожидалось ['молоко', 'хлеб', 'яблоки'], получено {shopping_list}")
`,
        expectedOutput: "['молоко', 'хлеб', 'яблоки']",
        hint: "Сначала сделайте shopping_list = [], а затем три раза вызовите shopping_list.append('...') с нужными продуктами.",
        quiz: {
          question: "Какой индекс имеет ПОСЛЕДНИЙ элемент в списке my_list = [10, 20, 30, 40]?",
          options: [
            "4",
            "3 или -1",
            "0",
            "Только -1"
          ],
          correctIdx: 1,
          explanation: "Индексация начинается с 0, поэтому индексы элементов: 0, 1, 2, 3. Также в Python поддерживаются отрицательные индексы, где -1 — это последний элемент списка."
        }
      },
      {
        id: "m3-l2",
        title: "Словари (Dictionary)",
        theory: `
          <h3>Словари: Данные в формате Ключ-Значение 🔑</h3>
          <p>Словарь (dict) — это неупорядоченная структура данных, которая хранит пары <strong>ключ: значение</strong>. Словари создаются в фигурных скобках <code>{}</code>.</p>
          
          <pre class="bg-black/40 p-3 rounded-lg border border-slate-800 my-3 font-mono text-xs text-slate-200"><code># Создаем словарь
user = {
    "name": "Анна",
    "age": 22,
    "city": "Москва"
}

# Получаем значение по ключу
print(user["name"]) # Выведет: Анна

# Изменяем или добавляем значение
user["age"] = 23
user["is_active"] = True</code></pre>
          
          <p>Ключи в словаре должны быть уникальными и неизменяемыми типами данных (обычно это строки или числа).</p>
          
          <h4 class="text-emerald-400 font-semibold mt-4 mb-2">Задание:</h4>
          <p>Создайте словарь с именем <code>capitals</code>, содержащий две пары ключ-значение:</p>
          <ul class="list-disc list-inside space-y-1">
            <li><code>"Россия"</code> со значением <code>"Москва"</code></li>
            <li><code>"Франция"</code> со значением <code>"Париж"</code></li>
          </ul>
          <p>Затем добавьте в этот словарь еще одну пару: <code>"Италия"</code> со значением <code>"Рим"</code> и выведите словарь на экран.</p>
        `,
        starterCode: `# Создайте словарь capitals с Россией и Францией\ncapitals = {\n    \n}\n\n# Добавьте Италию\n\n# Выведите capitals\n`,
        validationType: "eval",
        validationCode: `
if 'capitals' not in globals():
    raise AssertionError("Словарь 'capitals' не создан")
if capitals.get("Россия") != "Москва" or capitals.get("Франция") != "Париж" or capitals.get("Италия") != "Рим":
    raise AssertionError("Содержимое словаря capitals неверно. Проверьте ключи и значения!")
`,
        expectedOutput: "{'Россия': 'Москва', 'Франция': 'Париж', 'Италия': 'Рим'}",
        hint: "Добавить новый элемент можно так: capitals['Италия'] = 'Рим'",
        quiz: {
          question: "Что произойдет, если запросить значение по несуществующему ключу, например, my_dict['ghost']?",
          options: [
            "Вернется значение None",
            "Программа упадет с ошибкой KeyError",
            "Ключ автоматически создастся со значением None",
            "Вернется пустая строка"
          ],
          correctIdx: 1,
          explanation: "Если запросить ключ напрямую через квадратные скобки `dict[key]`, и этого ключа нет в словаре, Python вызовет исключение KeyError. Чтобы избежать этого, можно использовать безопасный метод `.get(key)`."
        }
      }
    ]
  }
];

export const playgroundTemplates: CodeTemplate[] = [
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

export const cheatsheetData: CheatSheetItem[] = [
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
