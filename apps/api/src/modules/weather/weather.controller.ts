import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@ApiBearerAuth()
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  @ApiOperation({ summary: 'Current weather for a location (city, lat/lon, or postcode)' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  current(@Query('location') location: string) {
    if (!location) throw new BadRequestException('A "location" query parameter is required');
    return this.weatherService.getCurrent(location);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Multi-day forecast with current conditions' })
  @ApiQuery({ name: 'location', example: 'Mumbai' })
  @ApiQuery({ name: 'days', required: false, example: 3 })
  forecast(@Query('location') location: string, @Query('days') days?: string) {
    if (!location) throw new BadRequestException('A "location" query parameter is required');
    return this.weatherService.getForecast(location, days ? Number(days) : 3);
  }
}
