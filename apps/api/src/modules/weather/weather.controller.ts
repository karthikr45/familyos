import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@ApiBearerAuth()
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  private requireLocation(location?: string): string {
    if (!location) throw new BadRequestException('A "location" query parameter is required');
    return location;
  }

  @Get('current')
  @ApiOperation({ summary: 'Current weather for a location' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  current(@Query('location') location: string) {
    return this.weatherService.getCurrent(this.requireLocation(location));
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Forecast with hourly data, astronomy, and alerts' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  @ApiQuery({ name: 'days', required: false, example: 3 })
  forecast(@Query('location') location: string, @Query('days') days?: string) {
    return this.weatherService.getForecast(this.requireLocation(location), days ? Number(days) : 3);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Aggregated current + forecast + alerts + sports (one call)' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  overview(@Query('location') location: string) {
    return this.weatherService.getOverview(this.requireLocation(location));
  }

  @Get('astronomy')
  @ApiOperation({ summary: 'Sunrise/sunset and moon data' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-26' })
  astronomy(@Query('location') location: string, @Query('date') date?: string) {
    return this.weatherService.getAstronomy(this.requireLocation(location), date);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Active weather alerts and warnings' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  alerts(@Query('location') location: string) {
    return this.weatherService.getAlerts(this.requireLocation(location));
  }

  @Get('marine')
  @ApiOperation({ summary: 'Marine/tide forecast (coastal locations)' })
  @ApiQuery({ name: 'location', example: 'Goa' })
  @ApiQuery({ name: 'days', required: false, example: 3 })
  marine(@Query('location') location: string, @Query('days') days?: string) {
    return this.weatherService.getMarine(this.requireLocation(location), days ? Number(days) : 3);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historical weather for a past date' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  @ApiQuery({ name: 'date', example: '2026-05-01' })
  history(@Query('location') location: string, @Query('date') date: string) {
    if (!date) throw new BadRequestException('A "date" (YYYY-MM-DD) query parameter is required');
    return this.weatherService.getHistory(this.requireLocation(location), date);
  }

  @Get('future')
  @ApiOperation({ summary: 'Forecast for a date 14–300 days ahead (trip planning)' })
  @ApiQuery({ name: 'location', example: 'Manali' })
  @ApiQuery({ name: 'date', example: '2026-07-15' })
  future(@Query('location') location: string, @Query('date') date: string) {
    if (!date) throw new BadRequestException('A "date" (YYYY-MM-DD) query parameter is required');
    return this.weatherService.getFuture(this.requireLocation(location), date);
  }

  @Get('sports')
  @ApiOperation({ summary: 'Upcoming football, cricket, and golf events near a location' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  sports(@Query('location') location: string) {
    return this.weatherService.getSports(this.requireLocation(location));
  }

  @Get('timezone')
  @ApiOperation({ summary: 'Timezone and local time for a location' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  timezone(@Query('location') location: string) {
    return this.weatherService.getTimezone(this.requireLocation(location));
  }

  @Get('search')
  @ApiOperation({ summary: 'Autocomplete location search' })
  @ApiQuery({ name: 'q', example: 'Mum' })
  search(@Query('q') q: string) {
    if (!q) throw new BadRequestException('A "q" query parameter is required');
    return this.weatherService.search(q);
  }

  @Get('ip')
  @ApiOperation({ summary: 'Detect a location from an IP address (defaults to caller)' })
  @ApiQuery({ name: 'ip', required: false })
  ip(@Query('ip') ip?: string) {
    return this.weatherService.lookupIp(ip || 'auto:ip');
  }
}
