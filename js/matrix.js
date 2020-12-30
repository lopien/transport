/**
 * Новый объект матрицы
 * @public 
 * @param {Array} sources
 * @param {Array} purchasers
 * @returns {Matrix}
 */
function Matrix ( sources, purchasers ) {
    /**
     * @field
     * @type Array
     */
    var _sources = sources;
    /**
     * @field
     * @type Array
     */
    var _purchasers = purchasers;
    /**
     * @field
     * @type Array
     */
    var _matrix = _generateMatrix( _sources.length, _purchasers.length );
    /**
     * @field
     * @type Array
     */
    var _queue = [];
    /**
     * @field
     * @type Array
     */
    var _loadedMatrixes = [];
    /**
     * @field
     * @type Number
     */
    var _result;

    /**
     * Создает пустую матрицу
     * @private
     * @param {Number} m rows
     * @param {Number} n columns
     * @param {Boolean} useZeros если true, заполнить 0 в nulls
     * @returns {Array}
     */
    function _generateMatrix ( m, n, useZeros ) {
        var value = useZeros ? 0 : null;
        var matrix = [];
        for (var i = 0; i < m; i++) {
            matrix[i] = [];
            for (var j = 0; j < n; j++) {
                matrix[i][j] = value;
            }
        }
        return matrix;
    }
    /**
     * Получить очередь элементов матрицы, отсортированных по возрастанию по значению
     * @private
     * @returns {Array}
     */
    function _getQueue () {
        // Предыдущее проверенное минимальное значение
        var previousMin = -1;

        // Количество элементов в матрице
        var numberElements = _sources.length * _purchasers.length;

        while ( _queue.length < numberElements ) {
            // Минимальное значение присваивает первый элемент
            var min = {
                i: 0,
                j: 0,
                value: -1
            };
            var queueEqualValues = [];
            for (var i = 0; i < _sources.length; i++) {
                // Очередь элементов в текущей строке матрицы
                var queueRow = [];
                for (var j = 0; j < _purchasers.length; j++) {
                    var value = _matrix[i][j];
                    // Если значение больше, чем ранее проверенное минимальное значение
                    if ( value > previousMin ) {
                        // Если значение ниже, чем ранее найденное минимальное значение, обновите минимальное значение
                        if ( value < min.value || min.value < 0 ) {
                            // TODO просмотрите этот код: получение одного и того же queueEqualValues несколько раз
                            min = {
                                i: i,
                                j: j,
                                value: value
                            };
                            queueEqualValues = [];
                            queueRow = [min];
                        }
                        // Если значение равно ранее найденному минимальному значению, добавить значение в очередь строки
                        else if ( value === min.value
                            && (queueEqualValues.length || queueRow.length)
                            ) {
                            queueRow.push( {
                                i: i,
                                j: j,
                                value: value
                            } );
                        }
                    }
                }

                // Если в одной строке есть несколько элементов с одинаковым значением
                if ( queueRow.length > 1 ) {
                    queueRow = _sortQueueMembers( queueRow );
                }

                queueEqualValues = queueEqualValues.concat( queueRow );
            }

            previousMin = min.value;
            _queue = _queue.concat( queueEqualValues );
        }
        return true;
    }
    /**
     * Правильно отсортируйте участников очереди из одной строки, от наивысшего потенциала к наименьшему
     * @param {Array} queue
     * @returns {Array}
     */
    function _sortQueueMembers ( queue ) {
        for (var k = 0; k < queue.length; k++) {
            var baseValue = _purchasers[queue[k].j];
            for (var l = k + 1; l < queue.length; l++) {
                if ( _purchasers[queue[l].j] > baseValue ) {
                    var tmp = queue[k].j;
                    queue[k].j = queue[l].j;
                    queue[l].j = tmp;
                }
            }
        }
        return queue;
    }
    /**
     * Матрица нагрузки
     * @returns {unresolved}
     */
    function _loadMatrix () {
        var sources = _sources.clone();
        var purchasers = _purchasers.clone();
        var queue = _queue.clone();
        var loadedMatrix = _generateMatrix( sources.length, purchasers.length, true );
        // Пока очередь содержит элементы
        while ( queue.length > 0 ) {
            // Сдвинуть первый элемент очереди
            var element = queue.shift();
            // Если стоимость источника больше, то загружайте полную стоимость покупателя.
            if ( sources[element.i] >= purchasers[element.j] ) {
                loadedMatrix[element.i][element.j] = purchasers[element.j];
                sources[element.i] -= purchasers[element.j];
                purchasers[element.j] = 0;
            }
            // Если стоимость покупателя больше, то загрузите полную стоимость источника
            else {
                loadedMatrix[element.i][element.j] = sources[element.i];
                purchasers[element.j] -= sources[element.i];
                sources[element.i] = 0;
            }
        }
        return loadedMatrix;
    }
    /**
     * Получить петли из матрицы
     * @param {Array} loadedMatrix
     * @returns {Array|Boolean}
     */
    function _findLoops ( loadedMatrix ) {
        var loops = [];
        var data = {
            hasBeenReloaded: false
        };
        var zMin = 0;
        var maxPositiveLoopValue = 0;

        for (var i = 0; i < _sources.length; i++) {
            for (var j = 0; j < _purchasers.length; j++) {
                // Если элементы не загружены, найдите его цикл
                if ( loadedMatrix[i][j] === 0 ) {
                    var elements = _findLoopOfBase( loadedMatrix, i, j );
                    // Добавьте его в другие петли
                    if ( elements !== false ) {
                        var value = _getLoopValue( elements );
                        loops.push( {
                            elements: elements,
                            i: i,
                            j: j,
                            value: value
                        } );
                        if ( maxPositiveLoopValue < value ) {
                            maxPositiveLoopValue = value;

                            $.extend( data, _getLoopData( loadedMatrix, elements ) );
                            data.positiveLoopIndex = loops.length - 1;
                            data.hasBeenReloaded = true;
                        }
                    } else {
                        return false;
                    }
                } else {
                    zMin += loadedMatrix[i][j] * _matrix[i][j];
                }
            }
        }
        return {
            zMin: zMin,
            loops: loops,
            data: data
        };
    }
    /**
     * Найдите цикл вокруг заданной матрицы и заданного элемента матрицы
     * @param {Array} matrix
     * @param {Number} baseI
     * @param {Number} baseJ
     * @returns {@exp;stack@call;toArray|Boolean}
     */
    function _findLoopOfBase ( matrix, baseI, baseJ ) {
        var m = matrix.length;
        var n = matrix[0].length;

        /**
         * Объект стека
         * @class Встроенное объявление объекта стека
         * @return {Stack}
         */
        var stack = function () {
            // Контейнер для стека
            var stack = [];
            /**
             * Проверяет, используется ли id уже
             * @public
             * @param {Number} id
             * @returns {Boolean}
             */
            stack.containsId = function ( id ) {
                for (var k in stack) {
                    if ( stack[k].id === id ) {
                        return true;
                    }
                }
                return false;
            };
            /**
             * Добавляет в конец стека и генерирует уникальный идентификатор
             * @public
             * @param {Object} object
             * @returns {Void}
             */
            stack.push = function ( object ) {
                object.id = cantorPairing( object.i, object.j );
                stack[stack.length] = object;
            };
            /**
             * Преобразует стек в массив
             * @public
             * @returns {Array}
             */
            stack.toArray = function () {
                var i = 0;
                var array = [];
                while ( typeof stack[i] !== 'undefined' ) {
                    array[i] = stack[i];
                    i++;
                }
                return array;
            };
            return stack;
        }();
        /**
         * Рекурсивная функция для поиска краев цикла
         * @param {Number} startI `i` координата начального элемента
         * @param {Number} startJ `j` координата начального элемента
         * @param {Boolean} searchVertical заставить его искать по вертикали или горизонтали
         * @return {Boolean} Верно при успехе
         */
        function find ( startI, startJ, searchVertical ) {
            // Помещаем значение в стек
            stack.push( {
                i: startI,
                j: startJ,
                value: matrix[startI][startJ]
            } );
            // Искать в вертикальном направлении, только если для searchVertical задано значение true или undefined
            if ( searchVertical === true || searchVertical !== false ) {
                // Если мы находимся в том же столбце, что и базовое значение, мы готовы
                if ( baseJ === startJ && baseI !== startI ) {
                    return true;
                }

                // Искать наверх
                for (var k = startI - 1; k >= 0; k--) {
                    // Если матричный элемент положительный и еще не используется
                    if ( matrix[k][startJ] !== 0
                        && !stack.containsId( cantorPairing( k, startJ ) )
                        ) {
                        if ( find( k, startJ, false ) ) {
                            return true;
                        }
                    }
                }

                // Искать вниз
                for (var k = startI + 1; k < m; k++) {
                    // Если матричный элемент положительный и еще не используется
                    if ( matrix[k][startJ] !== 0
                        && !stack.containsId( cantorPairing( k, startJ ) )
                        ) {
                        if ( find( k, startJ, false ) ) {
                            return true;
                        }
                    }
                }
            }

            // Искать в горизонтальном направлении, только если для searchVertical задано значение false или undefined
            if ( searchVertical === false || typeof searchVertical === 'undefined' ) {
                // Если мы находимся в той же строке, что и начальное значение, мы готовы
                if ( baseI === startI && baseJ !== startJ ) {
                    return true;
                }

                // Искать слева
                for (var l = startJ - 1; l >= 0; l--) {
                    // Если матричный элемент положительный и еще не используется
                    if ( matrix[startI][l] !== 0
                        && !stack.containsId( cantorPairing( startI, l ) )
                        ) {
                        if ( find( startI, l, true ) ) {
                            return true;
                        }
                    }
                }
                // Искать вправо
                for (var l = startJ + 1; l < n; l++) {
                    // Если матричный элемент положительный и еще не используется
                    if ( matrix[startI][l] !== 0
                        && !stack.containsId( cantorPairing( startI, l ) )
                        ) {
                        if ( find( startI, l, true ) ) {
                            return true;
                        }
                    }
                }
            }

            // Если значение не возвращается, извлечь последнее значение из стека и вернуть false
            stack.pop();
            return false;
        }

        find( baseI, baseJ );
        return stack.toArray();
    }

    function _getLoopValue ( loop ) {
        var sum = 0;
        for (var k = 0; k < loop.length; k++) {
            sum += _matrix[loop[k].i][loop[k].j] * ((k % 2) ? 1 : -1);
        }
        return sum;
    }
    function _getLoopData ( loadedMatrix, elements ) {
        var thetaMin = 0;
        var thetaMinIndex = 0;
        var reloadedMatrix = loadedMatrix.clone( true );
        for (var k = 1; k < elements.length; k += 2) {
            if ( elements[k].value < thetaMin || thetaMin === 0 ) {
                thetaMin = elements[k].value;
                thetaMinIndex = k;
            }
        }

        for (var k = 0; k < elements.length; k++) {
            // Перезагрузить матрицу
            reloadedMatrix[elements[k].i][elements[k].j] += thetaMin * ((k % 2 === 0) ? 1 : -1);
        }

        return {
            thetaMinIndex: thetaMinIndex,
            reloadedMatrix: reloadedMatrix
        };
    }

    /**
     * Получить элементы очереди, как матрица была сначала загружена
     * @public
     * @returns {Array}
     */
    this.getQueue = function () {
        return _queue;
    };
    /**
     * Получить значение элемента
     * @public
     * @param {Number} i
     * @param {Number} j
     * @returns {Number}
     */
    this.getValue = function ( i, j ) {
        return _matrix[i][j];
    };
    /**
     * Получить результат матрицы
     * @public
     * @returns {Number}
     */
    this.getResult = function () {
        return _result;
    };
    /**
     * @returns {Array}
     */
    this.getSources = function () {
        return _sources;
    };
    /**
     * @returns {Array}
     */
    this.getPurchasers = function ( ) {
        return _purchasers;
    };
    /**
     * Установить значение для элемента
     * @public
     * @param {Numeric} i
     * @param {Numeric} j
     * @param {Numeric} value
     * @returns {undefined}
     */
    this.setValue = function ( i, j, value ) {
        _matrix[i][j] = value;
    };
    /**
     * Получить массив загруженных матриц
     * @public
     * @returns {unresolved}
     */
    this.getLoadedMatrixes = function () {
        return _loadedMatrixes;
    };
    /**
     * Решает матрицу, верно в случае успеха
     * @public
     * @returns {Boolean}
     */
    this.solve = function () {
        _getQueue();

        var loadedMatrix = _loadMatrix();

        do {
            var loopsOfLoadedMatrix = _findLoops( loadedMatrix );

            if ( loopsOfLoadedMatrix !== false ) {
                var loadedMatrixData = $.extend( {
                    loadedMatrix: loadedMatrix,
                    loops: loopsOfLoadedMatrix.loops,
                    zMin: loopsOfLoadedMatrix.zMin
                },
                loopsOfLoadedMatrix.data );
                _loadedMatrixes.push( loadedMatrixData );
            } else {
                return false;
            }

            loadedMatrix = loadedMatrixData.reloadedMatrix;
        } while ( _loadedMatrixes[_loadedMatrixes.length - 1].hasBeenReloaded )

        // Предпоследняя загруженная матрица
        if ( _loadedMatrixes.length > 1 ) {
            var lastButOne = _loadedMatrixes[_loadedMatrixes.length - 2];
            var lastButOnePositiveLoop = lastButOne.loops[lastButOne.positiveLoopIndex];
            _result = lastButOne.zMin - lastButOnePositiveLoop.value * lastButOnePositiveLoop.elements[lastButOne.thetaMinIndex].value;
        } else {
            _result = _loadedMatrixes[_loadedMatrixes.length - 1].zMin;
        }

        return true;
    };

    /**
     * @deprecated TODO Удалить 
     * @param {type} matrix
     * @returns {undefined}
     */
    this.setMatrix = function ( matrix ) {
        _matrix = matrix;
    };
}
