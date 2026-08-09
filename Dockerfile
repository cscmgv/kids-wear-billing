# PRODUCTION DOCKERFILE FOR RENDER / RAILWAY / CLOUD DEPLOYMENT
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["KidsBillingApp.csproj", "./"]
RUN dotnet restore "KidsBillingApp.csproj"
COPY . .
RUN dotnet publish "KidsBillingApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "KidsBillingApp.dll"]
