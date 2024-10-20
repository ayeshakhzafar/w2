$(document).ready(function () {
    const apiKey = "61b0d79558fff9830dcb9edb6bf9a57b"; 
    const geminiApiKey = "AIzaSyA1_OPhVWSgFHNAw-igJiWkCkfbP0sKEtM";
    let useCelsius = true; 
    let forecastData = []; 
    let weatherDataFetched = false;
  
    const initialBackground = "url('bg2.jpeg')"; 
  
    $(".search-bar").hide();
    $(".additional-options").hide();
    $("#weatherWidget").hide();
    $(".forecast-table").hide();
    $(".chatbot").hide();
    $(".welcome-section").hide(); 
    $(".weather-container").hide();
    $(".chart-container .temp-chart, .chart-container .condition-chart, .chart-container .line-chart").hide();
  
    $(".welcome-section").show();
  
    $("#homeLink").click(function () {
        $(".search-bar").hide();
        $(".additional-options").hide();
        $("#weatherWidget").hide();
        $(".forecast-table").hide();
        $(".chatbot").hide();
        $(".weather-container").hide(); 
        $(".chart-container .temp-chart, .chart-container .condition-chart, .chart-container .line-chart").hide(); 
        $(".welcome-section").show();
        $(".main-content").css("background-image", initialBackground);
    });
  
    $("#dashboardBtn").click(function () {
        $(".search-bar").show();
        $(".additional-options").show();
        $("#weatherWidget").hide(); 
        $(".forecast-table").hide(); 
        $(".chatbot").hide(); 
        $(".welcome-section").hide(); 
    });
  
    $("#tablesBtn").click(function () {
        $(".search-bar").hide();
        $(".additional-options").hide();
        $("#weatherWidget").hide(); 
        $(".forecast-table").show(); 
        $(".chatbot").show(); 
        $(".welcome-section").hide(); 
        $(".weather-container").hide();
        $(".chart-container .temp-chart, .chart-container .condition-chart, .chart-container .line-chart").hide();
    });
  
    $("#getWeatherBtn").click(function () {
        const city = $("#cityInput").val();
        getWeatherData(city);
    });
  
    $("#unitToggle").click(function () {
        useCelsius = !useCelsius; 
        const city = $("#cityInput").val();
        if (city) getWeatherData(city); 
    });
  
    $("#geolocationBtn").click(function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherDataByCoords(lat, lon);
            }, function () {
                alert("Unable to retrieve your location.");
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });
  
    $("#askChatbot").click(function () {
        const userInput = $("#chatInput").val().trim();
  
        if (userInput === "") {
            displayChatbotResponse("Please enter a message.");
            return; 
        }
  
        appendChatMessage(userInput, "user");
  
        if (userInput.includes("weather")) {
            const city = extractCityFromMessage(userInput);
            if (city) {
                getWeatherData(city, true);
            } else {
                displayChatbotResponse("Please provide a city for the weather.");
            }
        } else {
            fetchGeminiAnswer(userInput);
        }
    });
  
    function appendChatMessage(message, sender) {
        const chatResponse = $("#chatResponse");
  
        const messageElement = $("<div></div>").text(message).addClass("p-2 rounded-lg mb-2");
  
        if (sender === "user") {
            messageElement.addClass("bg-white bg-opacity-60 text-black text-right");
        } else {
            messageElement.addClass("bg-black bg-opacity-70 text-white");
        }
  
        chatResponse.append(messageElement);
        chatResponse.scrollTop(chatResponse[0].scrollHeight); 
    }
  
    function displayChatbotResponse(responseText) {
        $(".weather-container").hide();
        $(".chart-container .temp-chart, .chart-container .condition-chart, .chart-container .line-chart").hide();
        appendChatMessage(responseText, "bot"); 
        $("#chatInput").val(""); 
    }
  
    function extractCityFromMessage(message) {
        const cityMatch = message.match(/in\s+(\w+)/); 
        return cityMatch ? cityMatch[1] : null;
    }
  
    async function fetchGeminiAnswer(userInput) {
        const apiKey = geminiApiKey; // Assuming geminiApiKey is globally defined
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (!userInput || userInput.trim() === '') {
            displayChatbotResponse("Error: Input is empty.");
            return;
        }

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: userInput
                        }
                    ]
                }
            ]
        };

        try {
            console.log("Request Body:", JSON.stringify(requestBody));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log(`Response Status: ${response.status}`);

            if (!response.ok) {
                const errorDetails = await response.json();
                console.error('Gemini API Error:', errorDetails);
                throw new Error(`Gemini API Error: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Full Response from API: ", data);

            if (data?.candidates?.length > 0) {
                const generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response found in expected format";
                displayChatbotResponse(generatedContent);
            } else {
                throw new Error('Received no candidates from Gemini.');
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            displayChatbotResponse("There was an error generating content");
        }
    }

  
  function getWeatherData(city, fromChatbot = false) {
    $("#loadingSpinner").removeClass("hidden"); 
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${
      useCelsius ? "metric" : "imperial"
    }`;
  
    $.get(currentWeatherUrl, function (data) {
      $("#cityName").text(data.name);
  
      const weatherInfo = `
        Temperature: ${data.main.temp} °${useCelsius ? "C" : "F"},
        Weather: ${data.weather[0].description},
        Humidity: ${data.main.humidity}%",
        Wind Speed: ${data.wind.speed} m/s
      `;
  
      const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
      $("#weatherIcon").attr("src", iconUrl);
  
      const newBackgroundUrl = getBackgroundImage(data.weather[0].main);
      $(".main-content").css("background-image", newBackgroundUrl);
  
      if (fromChatbot) {
        $("#answerArea").html(weatherInfo).removeClass("hidden"); 
        $(".weather-container").hide(); 
        appendChatMessage("Chatbot: " + weatherInfo); // Append to chat history
      } else {
        $("#currentWeather").html(weatherInfo);
        $(".weather-container").show();
        $(".chart-container").show();
        $(".temp-chart").show(); 
        $(".condition-chart").show(); 
        $(".line-chart").show(); 
  
        $("#weatherWidget").show(); 
        getForecastData(city); 
        weatherDataFetched = true;
      }
    })
    .fail(function () {
      const errorMessage = "City not found or API limit reached";
      if (fromChatbot) {
        $("#answerArea").html(errorMessage).removeClass("hidden"); 
        appendChatMessage("Chatbot: " + errorMessage); // Append error to chat history
      } else {
        alert(errorMessage);
      }
    })
    .always(function () {
      $("#loadingSpinner").addClass("hidden"); 
    });
  }
  

  function getWeatherDataByCoords(lat, lon) {
    $("#loadingSpinner").removeClass("hidden"); 
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${
      useCelsius ? "metric" : "imperial"
    }`;

    $.get(currentWeatherUrl, function (data) {
      
      $("#cityName").text(data.name);
      $("#currentWeather").html(
        `Temperature: ${data.main.temp} °${useCelsius ? "C" : "F"}, Weather: ${
          data.weather[0].description
        }`
      );

      const newBackgroundUrl = getBackgroundImage(data.weather[0].main); 
      $(".main-content").css("background-image", newBackgroundUrl);

      $("#weatherWidget").show();

      getForecastDataByCoords(lat, lon);
      weatherDataFetched = true;
    })
      .fail(function () {
        alert("Could not retrieve weather data for your location");
      })
      .always(function () {
     
        $("#loadingSpinner").addClass("hidden");
      });
  }

  function getForecastData(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${
      useCelsius ? "metric" : "imperial"
    }`;

    $.get(forecastUrl, function (data) {
      forecastData = data.list; 
      displayForecast(forecastData); 
      createCharts(forecastData); 
    });
  }

  function getForecastDataByCoords(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${
      useCelsius ? "metric" : "imperial"
    }`;

    $.get(forecastUrl, function (data) {
      forecastData = data.list; 
      displayForecast(forecastData); 
      createCharts(forecastData); 
    });
  }

  function displayForecast(forecastData) {
    $("#forecastTableBody").empty(); 
    forecastData.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toLocaleDateString();
      const temp = entry.main.temp;
      const condition = entry.weather[0].description;

      

      $("#forecastTableBody").append(`
        <tr>
          <td data-label="Date" class="border border-gray-200 p-2">${date}</td>
          <td data-label="Temperature" class="border border-gray-200 p-2">${temp} °${useCelsius ? "C" : "F"}</td>
          <td data-label="Condition" class="border border-gray-200 p-2">${condition}</td>
        </tr>
      `);
    });
    
    implementPagination(forecastData);
  }

  function implementPagination(forecastData) {
    const pageSize = 10;
    const pageCount = Math.ceil(forecastData.length / pageSize);
    let currentPage = 1;

    function renderPage(page) {
      $("#forecastTableBody").empty(); 
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = forecastData.slice(start, end);
      pageData.forEach((entry) => {
        const date = new Date(entry.dt * 1000).toLocaleDateString();
        const temp = entry.main.temp;
        const condition = entry.weather[0].description;
        $("#forecastTableBody").append(`
            <tr>
              <td class="border border-gray-200 p-2">${date}</td>
              <td class="border border-gray-200 p-2">${temp} °${useCelsius ? "C" : "F"}</td>
              <td class="border border-gray-200 p-2">${condition}</td>
            </tr>
          `);


      });

      
      
    }

    $("#pagination").empty();

    
    for (let i = 1; i <= pageCount; i++) {
      $("#pagination").append(
        `<button class="pageBtn border border-white font-bold text-[#3a2e28] bg-[#D9CBA0] p-2 rounded hover:bg-[#D0C49D] transition-colors">${i}</button>`
      );
    }

    $(".pageBtn").click(function () {
      currentPage = parseInt($(this).text());
      renderPage(currentPage);
    });

    renderPage(currentPage); 
  }

  function createCharts(forecastData) {
    const labels = [];
    const temps = [];
    const conditions = {};
    forecastData.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toLocaleDateString();
      labels.push(date);
      temps.push(entry.main.temp);
      conditions[entry.weather[0].main] =
        (conditions[entry.weather[0].main] || 0) + 1;
    });
    drawCharts(labels, temps, conditions);
  }

  function drawCharts(labels, temps, conditions) {
    const ctxTemp = document.getElementById("tempChart").getContext("2d");
    const ctxCondition = document
      .getElementById("conditionChart")
      .getContext("2d");
    const ctxLine = document.getElementById("lineChart").getContext("2d");
    
    const chartWidth = window.innerWidth < 768 ? 150 : 300; 
    const chartHeight = window.innerWidth < 768 ? 150 : 250; 

    $("#tempChart").attr("width", chartWidth).attr("height", chartHeight);
    $("#conditionChart").attr("width", chartWidth).attr("height", chartHeight);
    $("#lineChart").attr("width", chartWidth).attr("height", chartHeight);

    new Chart(ctxTemp, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: temps,
            backgroundColor: "rgba(106, 90, 205, 0.7)", 
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: "black", 
            },
            grid: {
              color: "black", 
            },
          },
          y: {
            ticks: {
              color: "black", 
            },
            grid: {
              color: "black", 
            },
          },
        },
        animation: {
          delay: 100,
        },
        plugins: {
          legend: {
            labels: {
              color: "black", 
            },
          },
        },
      },
    });

    new Chart(ctxCondition, {
      type: "doughnut",
      data: {
        labels: Object.keys(conditions),
        datasets: [
          {
            data: Object.values(conditions),
            backgroundColor: [
              "rgba(100, 149, 237, 0.7)", 
              "rgba(255, 228, 196, 0.7)", 
              "rgba(255, 99, 71, 0.7)", 
            ],
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          delay: 100,
        },
        plugins: {
          legend: {
            labels: {
              color: "black", 
            },
          },
        },
        elements: {
          arc: {
            borderColor: "black", 
          },
        },
      },
    });

  
    new Chart(ctxLine, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: temps,
            borderColor: "rgba(255, 159, 64, 1)", 
            fill: false,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: "black", 
            },
            grid: {
              color: "black", 
            },
          },
          y: {
            ticks: {
              color: "black", 
            },
            grid: {
              color: "black", 
            },
          },
        },
        animation: {
          onComplete: function () {},
        },
        plugins: {
          legend: {
            labels: {
              color: "black",
            },
          },
        },
      },
    });
  }

  function getBackgroundImage(weatherCondition) {
    switch (weatherCondition) {
      case "Clear":
        return 'url("clearSky.jpg")';
      case "Clouds":
        return 'url("cloudy.jpg")';
      case "Rain":
        return 'url("rainy.jpg")';
      default:
        return 'url("default.png")';
    }
  }

  $("#sortAscBtn").click(function () {
    forecastData.sort((a, b) => a.main.temp - b.main.temp); 
    implementPagination(forecastData); 
  });

  $("#sortDescBtn").click(function () {
    forecastData.sort((a, b) => b.main.temp - a.main.temp); 
    implementPagination(forecastData); 
  });

  $("#filterRainBtn").click(function () {
    const rainyDays = forecastData.filter(
      (entry) => entry.weather[0].main.toLowerCase() === "rain"
    );
    displayForecast(rainyDays);
  });

  function showHighestTemperature() {
    const highest = forecastData.reduce((prev, current) =>
      prev.main.temp > current.main.temp ? prev : current
    );
    const date = new Date(highest.dt * 1000).toLocaleDateString();
    $("#chatResponse").text(
      `The highest temperature is ${highest.main.temp} °${
        useCelsius ? "C" : "F"
      } on ${date}.`
    );
  }

  
  $("#showHighestTempBtn").click(showHighestTemperature);
});
